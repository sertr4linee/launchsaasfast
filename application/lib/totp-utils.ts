import { getTOTPManager } from './totp';
import type { TOTPVerification, TOTPValidationResult } from '../types/auth';

/**
 * TOTP validation utilities and helpers
 */

/**
 * Validate a TOTP token format
 */
export function isValidTOTPFormat(token: string): boolean {
  // Remove any spaces and check if it's 6 digits
  const cleanToken = token.replace(/\s/g, '');
  return /^\d{6}$/.test(cleanToken);
}

/**
 * Validate a backup code format
 */
export function isValidBackupCodeFormat(code: string): boolean {
  // Backup codes should be 8 characters, alphanumeric
  const cleanCode = code.replace(/\s/g, '').toUpperCase();
  return /^[A-Z0-9]{8}$/.test(cleanCode);
}

/**
 * Quick TOTP verification wrapper
 */
export async function verifyUserTOTP(
  userId: string, 
  token: string, 
  isBackupCode: boolean = false
): Promise<TOTPValidationResult> {
  const totp = getTOTPManager();
  
  const verification: TOTPVerification = {
    userId,
    token: token.replace(/\s/g, '').toUpperCase(),
    isBackupCode,
  };
  
  return await totp.verifyTOTP(verification);
}

/**
 * Check if user has 2FA enabled
 */
export async function userHas2FA(userId: string): Promise<boolean> {
  const totp = getTOTPManager();
  return await totp.is2FAEnabled(userId);
}

/**
 * Get backup codes status for user
 */
export async function getBackupCodesStatus(userId: string): Promise<{
  total: number;
  remaining: number;
  needsRefresh: boolean;
}> {
  const totp = getTOTPManager();
  const { total, remaining } = await totp.getBackupCodesCount(userId);
  
  return {
    total,
    remaining,
    needsRefresh: remaining < 3, // Suggest refresh when less than 3 codes left
  };
}

/**
 * Format backup codes for display (with spacing)
 */
export function formatBackupCode(code: string): string {
  return code.replace(/(.{4})(.{4})/, '$1-$2');
}

/**
 * Clean and validate input tokens/codes
 */
export function cleanAndValidateInput(input: string, isBackupCode: boolean = false): {
  isValid: boolean;
  cleaned: string;
  error?: string;
} {
  const cleaned = input.replace(/\s|-/g, '').toUpperCase();
  
  if (isBackupCode) {
    if (!isValidBackupCodeFormat(cleaned)) {
      return {
        isValid: false,
        cleaned,
        error: 'Backup code must be 8 alphanumeric characters',
      };
    }
  } else {
    if (!isValidTOTPFormat(cleaned)) {
      return {
        isValid: false,
        cleaned,
        error: 'TOTP token must be 6 digits',
      };
    }
  }
  
  return { isValid: true, cleaned };
}
