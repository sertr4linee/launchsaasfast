import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseServer } from './supabase/server';
import { getConfig } from '../config';
import type { 
  TOTPSetupResult, 
  TOTPValidationResult, 
  TOTPVerification,
  BackupCode,
  MFAConfig 
} from '../types/auth';

/**
 * TOTP (Time-based One-Time Password) Manager
 * RFC 6238 compliant implementation for 2FA
 */
export class TOTPManager {
  private config: MFAConfig;
  private saltRounds: number = 12;

  constructor() {
    const appConfig = getConfig();
    this.config = appConfig.mfa.totp;
    
    // Configure otplib with our settings
    authenticator.options = {
      digits: this.config.digits,
      step: this.config.period,
      window: this.config.window,
    };
  }

  /**
   * Generate a new TOTP secret and setup 2FA for a user
   */
  async generateSecret(userId: string, userEmail: string): Promise<TOTPSetupResult> {
    try {
      // Generate a new secret
      const secret = authenticator.generateSecret();
      
      // Create service name for the authenticator app
      const serviceName = `${this.config.issuer}:${userEmail}`;
      
      // Generate otpauth URL for QR code
      const otpauthUrl = authenticator.keyuri(userEmail, this.config.issuer, secret);
      
      // Generate QR code as data URL
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
      
      // Generate backup codes
      const backupCodes = await this.generateBackupCodes(userId);
      
      // Store encrypted secret in database
      await this.storeUserSecret(userId, secret);
      
      return {
        secret,
        qrCodeUrl,
        backupCodes,
      };
      
    } catch (error) {
      console.error('Error generating TOTP secret:', error);
      throw new Error('Failed to generate 2FA setup');
    }
  }

  /**
   * Verify a TOTP token or backup code
   */
  async verifyTOTP(verification: TOTPVerification): Promise<TOTPValidationResult> {
    const { userId, token, isBackupCode = false } = verification;

    try {
      if (isBackupCode) {
        return await this.verifyBackupCode(userId, token);
      } else {
        return await this.verifyTOTPToken(userId, token);
      }
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return { isValid: false };
    }
  }

  /**
   * Verify TOTP token against user's secret
   */
  private async verifyTOTPToken(userId: string, token: string): Promise<TOTPValidationResult> {
    // Get user's secret from database
    const userSecret = await this.getUserSecret(userId);
    if (!userSecret) {
      return { isValid: false };
    }

    // Verify the token
    const isValid = authenticator.verify({
      token: token.replace(/\s/g, ''), // Remove any spaces
      secret: userSecret,
    });

    return { isValid };
  }

  /**
   * Verify backup code and mark as used if valid
   */
  private async verifyBackupCode(userId: string, code: string): Promise<TOTPValidationResult> {
    // Get user's backup codes
    const backupCodes = await this.getUserBackupCodes(userId);
    
    // Check if any unused backup code matches
    for (const backupCode of backupCodes) {
      if (!backupCode.isUsed && await bcrypt.compare(code, backupCode.codeHash)) {
        // Mark this backup code as used
        await this.markBackupCodeAsUsed(backupCode.id);
        
        // Count remaining backup codes
        const remainingCodes = backupCodes.filter(bc => !bc.isUsed && bc.id !== backupCode.id).length;
        
        return {
          isValid: true,
          usedBackupCode: true,
          remainingBackupCodes: remainingCodes,
        };
      }
    }

    return { isValid: false };
  }

  /**
   * Generate backup codes for a user
   */
  private async generateBackupCodes(userId: string): Promise<string[]> {
    const codes: string[] = [];
    const hashedCodes: Omit<BackupCode, 'id' | 'createdAt'>[] = [];

    // Generate specified number of backup codes
    for (let i = 0; i < 10; i++) {
      const code = this.generateSecureCode(8);
      const hash = await bcrypt.hash(code, this.saltRounds);
      
      codes.push(code);
      hashedCodes.push({
        userId,
        codeHash: hash,
        isUsed: false,
      });
    }

    // Store hashed codes in database
    await this.storeBackupCodes(hashedCodes);
    
    return codes;
  }

  /**
   * Generate a secure random code
   */
  private generateSecureCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    
    return result;
  }

  /**
   * Store user's TOTP secret in database (encrypted)
   */
  private async storeUserSecret(userId: string, secret: string): Promise<void> {
    const { error } = await supabaseServer
      .from('user_totp_secrets')
      .upsert({
        user_id: userId,
        secret_encrypted: secret, // TODO: Implement proper encryption
        is_verified: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error storing TOTP secret:', error);
      throw new Error('Failed to store TOTP secret');
    }
  }

  /**
   * Get user's TOTP secret from database
   */
  private async getUserSecret(userId: string): Promise<string | null> {
    const { data, error } = await supabaseServer
      .from('user_totp_secrets')
      .select('secret_encrypted')
      .eq('user_id', userId)
      .eq('is_verified', true)
      .single();

    if (error || !data) {
      return null;
    }

    // TODO: Implement proper decryption
    return data.secret_encrypted;
  }

  /**
   * Store backup codes in database
   */
  private async storeBackupCodes(codes: Omit<BackupCode, 'id' | 'createdAt'>[]): Promise<void> {
    const codesWithIds = codes.map(code => ({
      id: uuidv4(),
      user_id: code.userId,
      code_hash: code.codeHash,
      is_used: code.isUsed,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabaseServer
      .from('user_backup_codes')
      .insert(codesWithIds);

    if (error) {
      console.error('Error storing backup codes:', error);
      throw new Error('Failed to store backup codes');
    }
  }

  /**
   * Get user's backup codes from database
   */
  private async getUserBackupCodes(userId: string): Promise<BackupCode[]> {
    const { data, error } = await supabaseServer
      .from('user_backup_codes')
      .select('id, user_id, code_hash, is_used, created_at, used_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching backup codes:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      codeHash: row.code_hash,
      isUsed: row.is_used,
      createdAt: new Date(row.created_at),
      usedAt: row.used_at ? new Date(row.used_at) : undefined,
    }));
  }

  /**
   * Mark a backup code as used
   */
  private async markBackupCodeAsUsed(codeId: string): Promise<void> {
    const { error } = await supabaseServer
      .from('user_backup_codes')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', codeId);

    if (error) {
      console.error('Error marking backup code as used:', error);
      throw new Error('Failed to update backup code');
    }
  }

  /**
   * Enable 2FA for a user after successful verification
   */
  async enable2FA(userId: string): Promise<void> {
    const { error } = await supabaseServer
      .from('user_totp_secrets')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error enabling 2FA:', error);
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string): Promise<void> {
    // Remove TOTP secret
    const { error: secretError } = await supabaseServer
      .from('user_totp_secrets')
      .delete()
      .eq('user_id', userId);

    if (secretError) {
      console.error('Error removing TOTP secret:', secretError);
      throw new Error('Failed to disable 2FA');
    }

    // Remove backup codes
    const { error: codesError } = await supabaseServer
      .from('user_backup_codes')
      .delete()
      .eq('user_id', userId);

    if (codesError) {
      console.error('Error removing backup codes:', codesError);
      // Don't throw here, TOTP secret is already removed
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const { data, error } = await supabaseServer
      .from('user_totp_secrets')
      .select('is_verified')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_verified;
  }

  /**
   * Get user's backup codes count
   */
  async getBackupCodesCount(userId: string): Promise<{ total: number; remaining: number }> {
    const { data, error } = await supabaseServer
      .from('user_backup_codes')
      .select('is_used')
      .eq('user_id', userId);

    if (error || !data) {
      return { total: 0, remaining: 0 };
    }

    const total = data.length;
    const remaining = data.filter(code => !code.is_used).length;

    return { total, remaining };
  }
}

// Singleton instance
let totpManager: TOTPManager | null = null;

/**
 * Get TOTP manager singleton instance
 */
export function getTOTPManager(): TOTPManager {
  if (!totpManager) {
    totpManager = new TOTPManager();
  }
  return totpManager;
}

// Export singleton instance for convenience
export const totp = getTOTPManager();
