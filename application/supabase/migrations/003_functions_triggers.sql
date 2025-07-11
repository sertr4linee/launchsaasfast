-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables
DO $$
DECLARE 
  tbl_name text;
  table_names text[] := ARRAY['users','user_devices','device_sessions','security_events'];
BEGIN
  FOREACH tbl_name IN ARRAY table_names LOOP
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column()', 
                   tbl_name, tbl_name);
  END LOOP;
END;
$$;

-- Function to verify user password (AAL)
CREATE OR REPLACE FUNCTION public.verify_user_password(user_id uuid, password text)
RETURNS boolean AS $$
DECLARE stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash FROM auth.users WHERE id = user_id;
  RETURN crypt(password, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql;
