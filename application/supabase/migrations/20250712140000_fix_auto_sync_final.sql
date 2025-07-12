-- Migration pour corriger la synchronisation automatique auth.users -> public.users
-- Date: 2025-07-12

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer l'ancienne fonction s'elle existe  
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Créer la nouvelle fonction avec gestion d'erreurs robuste
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insérer le nouvel utilisateur dans public.users
  INSERT INTO public.users (id, created_at, updated_at)
  VALUES (new.id, new.created_at, new.updated_at)
  ON CONFLICT (id) DO NOTHING; -- Éviter les doublons
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log l'erreur mais ne pas faire échouer l'insertion auth
  RAISE WARNING 'Erreur dans handle_new_user pour user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$;

-- Créer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated;

-- Synchroniser les utilisateurs existants qui manquent
INSERT INTO public.users (id, created_at, updated_at)
SELECT 
  au.id,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
