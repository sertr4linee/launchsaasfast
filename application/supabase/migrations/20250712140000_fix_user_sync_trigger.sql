-- Corriger la fonction de synchronisation utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (NEW.id, NEW.created_at, NEW.created_at);
  RETURN NEW;
END;
$$;

-- Supprimer et recréer le trigger pour s'assurer qu'il fonctionne
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger pour synchroniser automatiquement les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Synchroniser les utilisateurs existants manquants
INSERT INTO public.users (id, created_at, updated_at)
SELECT 
  au.id, 
  au.created_at, 
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
