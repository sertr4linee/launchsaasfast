import { type User as SupabaseUser } from '@supabase/supabase-js';

// User types extending Supabase Auth
export interface User extends SupabaseUser {
  user_metadata: {
    name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

// Device confidence scoring types
export interface Device {
  id: string;
  user_id: string;
  device_name?: string;
  browser: string;
  os: string;
  ip_address: string;
  user_agent: string;
  screen_resolution?: string;
  country?: string;
  city?: string;
  timezone?: string;
  platform: string;
  language: string;
  first_seen: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

// Device session with AAL levels
export type AALLevel = 'aal1' | 'aal2';

export interface DeviceSession {
  id: string;
  device_id: string;
  user_id: string;
  confidence_score: number; // 0-100
  aal: AALLevel;
  is_trusted: boolean;
  expires_at: string;
  last_activity: string;
  session_token: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

// Form validation types
export interface FormError {
  field: string;
  message: string;
}

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  endpoint: string;
}

// 2FA types
export interface TOTPSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface BackupCode {
  id: string;
  user_id: string;
  code_hash: string;
  used_at?: string;
  created_at: string;
}
