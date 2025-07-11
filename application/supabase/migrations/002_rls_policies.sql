-- Enable RLS and set policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY select_users ON public.users
  FOR SELECT TO public
  USING (id = auth.uid());
CREATE POLICY insert_users ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- User devices policies
CREATE POLICY select_devices ON public.user_devices
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY insert_devices ON public.user_devices
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Device sessions policies
CREATE POLICY select_sessions ON public.device_sessions
  FOR SELECT USING (device_id IN (SELECT id FROM public.user_devices WHERE user_id = auth.uid()));
CREATE POLICY insert_sessions ON public.device_sessions
  FOR INSERT WITH CHECK (device_id IN (SELECT id FROM public.user_devices WHERE user_id = auth.uid()));

-- Security events policies
CREATE POLICY select_events ON public.security_events
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY insert_events ON public.security_events
  FOR INSERT WITH CHECK (user_id = auth.uid());
