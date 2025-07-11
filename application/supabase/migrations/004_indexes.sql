-- Performance indexes
-- User devices: by user_id
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
-- Device sessions: by device_id and last_activity
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id_last_activity ON public.device_sessions(device_id, last_activity DESC);
-- Security events: by user_id and created_at
CREATE INDEX IF NOT EXISTS idx_security_events_user_id_created_at ON public.security_events(user_id, created_at DESC);
-- Users: index created_at
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
