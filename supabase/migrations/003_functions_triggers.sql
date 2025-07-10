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
DECLARE tbl text;
BEGIN
  FOR tbl IN ARRAY['public.users','public.user_devices','public.device_sessions','public.security_events'] LOOP
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column()', tbl, tbl);
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
