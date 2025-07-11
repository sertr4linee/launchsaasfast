-- Create schema and tables
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table extending auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User devices table
CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  fingerprint text NOT NULL,
  user_agent text,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Device sessions table
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES public.user_devices(id),
  session_token text NOT NULL,
  confidence_score int NOT NULL,
  aal_level int NOT NULL,
  last_activity timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Security events audit log
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
