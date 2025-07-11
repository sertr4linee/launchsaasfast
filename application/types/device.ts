export interface DeviceInfo {
  fingerprint: string;
  userAgent: string;
  browser: string;
  os: string;
  platform: string;
  ipAddress: string;
  timestamp: number;
}

export interface ParsedUserAgent {
  browser: string;
  os: string;
  platform: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceFingerprint: string;
  confidenceScore: number;
  aalLevel: number;
  isVerified: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export type ConfidenceLevel = 'trusted' | 'verified' | 'restricted';

export interface DeviceScoreWeights {
  browser: number;
  os: number;
  ip: number;
  fingerprint: number;
}
