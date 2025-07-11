-- Migration: Add 2FA/MFA tables for TOTP and backup codes
-- Date: 2025-07-10
-- Description: Tables for Time-based One-Time Password (TOTP) secrets and backup codes

-- Table for storing user TOTP secrets
CREATE TABLE user_totp_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Table for storing user backup codes
CREATE TABLE user_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_user_totp_secrets_user_id ON user_totp_secrets(user_id);
CREATE INDEX idx_user_totp_secrets_verified ON user_totp_secrets(user_id, is_verified);

CREATE INDEX idx_user_backup_codes_user_id ON user_backup_codes(user_id);
CREATE INDEX idx_user_backup_codes_unused ON user_backup_codes(user_id, is_used) WHERE is_used = false;

-- Add updated_at triggers
CREATE TRIGGER update_user_totp_secrets_updated_at 
  BEFORE UPDATE ON user_totp_secrets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_backup_codes_updated_at 
  BEFORE UPDATE ON user_backup_codes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE user_totp_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backup_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_totp_secrets
CREATE POLICY "Users can view their own TOTP secrets" ON user_totp_secrets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TOTP secrets" ON user_totp_secrets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TOTP secrets" ON user_totp_secrets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TOTP secrets" ON user_totp_secrets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_backup_codes
CREATE POLICY "Users can view their own backup codes" ON user_backup_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backup codes" ON user_backup_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup codes" ON user_backup_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backup codes" ON user_backup_codes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE user_totp_secrets IS 'Stores encrypted TOTP secrets for 2FA authentication';
COMMENT ON TABLE user_backup_codes IS 'Stores hashed backup codes for 2FA recovery';

COMMENT ON COLUMN user_totp_secrets.secret_encrypted IS 'Encrypted TOTP secret (base32)';
COMMENT ON COLUMN user_totp_secrets.is_verified IS 'Whether the TOTP setup has been verified';

COMMENT ON COLUMN user_backup_codes.code_hash IS 'Bcrypt hash of the backup code';
COMMENT ON COLUMN user_backup_codes.is_used IS 'Whether this backup code has been used';
