-- Add user_id column to device_sessions table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'device_sessions' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.device_sessions 
        ADD COLUMN user_id uuid REFERENCES public.users(id);
        
        -- Add index for performance
        CREATE INDEX idx_device_sessions_user_id ON public.device_sessions(user_id);
    END IF;
END $$;