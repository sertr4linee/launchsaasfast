// Authentication types for LaunchSaasFast API
// Strict TypeScript types without 'any' - shrimp-rules.md compliant

import { Database } from '../supabase-types';

// Supabase database types
export type User = Database['public']['Tables']['users']['Row'];
export type DeviceSession = Database['public']['Tables']['device_sessions']['Row'];
export type Device = Database['public']['Tables']['devices']['Row'];
export type AccountEvent = Database['public']['Tables']['account_events']['Row'];
export type VerificationCode = Database['public']['Tables']['verification_codes']['Row'];
export type BackupCode = Database['public']['Tables']['backup_codes']['Row'];

// API Response types
export interface APIResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Authentication specific types
export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  deviceSession?: {
    id: string;
    trustLevel: 'trusted' | 'verified' | 'restricted';
    confidenceScore: number;
    requiresVerification: boolean;
  };
}

// Device tracking types (basic for Phase 1)
export interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser?: string;
  os?: string;
  fingerprint?: string;
}

// AAL (Authentication Assurance Level) types - NIST compliant
export type AALLevel = 'aal1' | 'aal2';

export interface SessionContext {
  userId: string;
  deviceSessionId: string;
  aal: AALLevel;
}
