-- Add user_id column to device_sessions table for easier querying
-- This allows direct querying by user_id without joining through user_devices

-- Add the user_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'device_sessions' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.device_sessions 
        ADD COLUMN user_id uuid REFERENCES public.users(id);
    END IF;
END $$;

-- Populate user_id from existing device_id relationships (if any exist)
UPDATE public.device_sessions 
SET user_id = (
  SELECT ud.user_id 
  FROM public.user_devices ud 
  WHERE ud.id = device_sessions.device_id
)
WHERE user_id IS NULL;

-- Make user_id NOT NULL for future inserts (after populating existing data)
-- We'll keep device_id as optional for now to maintain backward compatibility
ALTER TABLE public.device_sessions 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON public.device_sessions(user_id);

-- Update RLS policies to work with user_id
DROP POLICY IF EXISTS select_sessions ON public.device_sessions;
DROP POLICY IF EXISTS insert_sessions ON public.device_sessions;

CREATE POLICY select_sessions ON public.device_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY insert_sessions ON public.device_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY update_sessions ON public.device_sessions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY delete_sessions ON public.device_sessions
  FOR DELETE USING (user_id = auth.uid());
