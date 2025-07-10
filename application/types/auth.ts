/**
 * Authentication and 2FA related types
 */

export interface TOTPSecret {
  userId: string;
  secret: string;
  backupCodes: string[];
  qrCodeUrl: string;
  isVerified: boolean;
}

export interface BackupCode {
  id: string;
  userId: string;
  codeHash: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
}

export interface TOTPVerification {
  userId: string;
  token: string;
  isBackupCode?: boolean;
}

export interface TOTPSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TOTPValidationResult {
  isValid: boolean;
  usedBackupCode?: boolean;
  remainingBackupCodes?: number;
}

export interface MFAConfig {
  issuer: string;
  algorithm: string;
  digits: number;
  window: number;
  period: number;
}

export type AuthenticationLevel = 'AAL1' | 'AAL2';

export interface AALContext {
  level: AuthenticationLevel;
  factors: AuthenticationFactor[];
  upgradedAt?: Date;
  expiresAt?: Date;
}

export type AuthenticationFactor = 'password' | 'totp' | 'backup_code';
