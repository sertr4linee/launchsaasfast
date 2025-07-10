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

export interface AALCheckResult {
  allowed: boolean;
  currentAAL: AuthenticationLevel;
  requiredAAL: AuthenticationLevel;
  upgradeRequired?: boolean;
  upgradeOptions?: AuthenticationFactor[];
}

export interface AALUpgradeRequest {
  userId: string;
  sessionId: string;
  targetAAL: AuthenticationLevel;
  authenticationFactor: AuthenticationFactor;
}

export interface AALRequirement {
  level: AuthenticationLevel;
  description: string;
  factors: AuthenticationFactor[];
}

export interface AALSession {
  level: AuthenticationLevel;
  establishedAt: Date;
  expiresAt?: Date;
  factors: AuthenticationFactor[];
  deviceSessionId: string;
}

export type AALOperation = 
  | 'profile_update'
  | 'password_change' 
  | 'email_change'
  | '2fa_setup'
  | '2fa_disable'
  | 'sensitive_data_access'
  | 'account_deletion';
