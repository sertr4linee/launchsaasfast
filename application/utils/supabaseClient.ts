
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Utilise les variables d'environnement Next.js (préfixe NEXT_PUBLIC_)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client par défaut (sans token)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Fonction pour créer un client avec access_token (authentifié)
export function createClient(access_token?: string) {
	return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
		global: {
			headers: access_token
				? { Authorization: `Bearer ${access_token}` }
				: {},
		},
	});
}
