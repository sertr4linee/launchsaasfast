
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/server';

// API: GET /api/account/devices
export async function GET(req: NextRequest) {
  // Crée un client Supabase avec service_role pour accès admin
  const supabase = await createClient({ useServiceRole: true });

  // Authentifie l'utilisateur courant via cookie/session
  const anonClient = await createClient();
  const { data: { user }, error: userError } = await anonClient.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ---
  // Supabase v2 n'expose PAS listSessionsByUser (API manquante)
  // Fallback : retourne la session courante uniquement (mock), ou à adapter si table custom
  // ---
  // TODO: Si tu utilises une table custom pour les sessions/devices, requête-la ici !

  // Récupère la session courante (mock)
  const session = req.cookies.get('sb-session')?.value || null;
  // Pour l'exemple, retourne juste la session courante
  const sessions = session
    ? [
        {
          id: session,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || '',
          ip: req.headers.get('x-forwarded-for') || '',
          current: true,
        },
      ]
    : [];

  return NextResponse.json({ sessions });
}
