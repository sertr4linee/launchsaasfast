import { createClient } from '@supabase/supabase-js';

// Utilise les variables d'environnement Next.js (préfixe NEXT_PUBLIC_)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
