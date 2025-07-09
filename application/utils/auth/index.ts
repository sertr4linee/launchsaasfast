// Utilitaires d'authentification pour Supabase (2FA, méthodes, etc.)
import { SupabaseClient } from '@supabase/supabase-js';

export async function getUserVerificationMethods({
  supabase,
  supabaseAdmin,
}: {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
}) {
  // TODO: Adapter selon la structure de ta base (ex: table user_methods)
  // Ici, on simule la présence de 2FA activé et des méthodes disponibles
  return {
    has2FA: true,
    methods: ['totp', 'backup_code'],
  };
}

export async function getAuthenticatorAssuranceLevel(
  supabase: SupabaseClient,
  deviceSessionId: string
): Promise<'aal1' | 'aal2'> {
  // TODO: Adapter selon la logique de session/device/2FA
  // Ici, on simule toujours aal2 si deviceSessionId existe
  if (deviceSessionId) return 'aal2';
  return 'aal1';
}
