import { supabaseServer } from './supabase/server';

/**
 * Vérifie le mot de passe d'un utilisateur selon les standards AAL
 * Cette fonction assure que l'authentification maintient le niveau de confiance requis
 */
export async function verify_user_password(email: string, password: string): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Utilisation de Supabase pour vérifier le mot de passe
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Utilisateur non trouvé'
      };
    }

    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de vérification du mot de passe'
    };
  }
}

/**
 * Génère un token de réinitialisation sécurisé
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
