import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/server';

// API: POST /api/account/devices/revoke
export async function POST(req: NextRequest) {
  // Crée un client Supabase avec service_role pour accès admin
  const supabase = await createClient({ useServiceRole: true });

  // Authentifie l'utilisateur courant via cookie/session
  const anonClient = await createClient();
  const { data: { user }, error: userError } = await anonClient.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse le body pour récupérer l'id de session/device à révoquer
  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  // ---
  // Supabase v2 n'expose PAS de méthode pour révoquer une session par l'admin (API manquante)
  // Fallback : si tu utilises une table custom, supprime la session ici
  // Si session courante, déconnecte l'utilisateur (à gérer côté client)
  // ---

  // Pour l'exemple, on ne peut révoquer que la session courante (mock)
  const currentSession = req.cookies.get('sb-session')?.value;
  if (sessionId !== currentSession) {
    // Dans un vrai système, vérifier ownership et supprimer la session cible
    return NextResponse.json({ error: 'Not implemented: only current session can be revoked in this mock.' }, { status: 501 });
  }

  // Déconnexion de la session courante
  await anonClient.auth.signOut();
  // Supprime le cookie côté client (à faire côté front aussi)
  const res = NextResponse.json({ success: true, revoked: sessionId });
  res.cookies.set('sb-session', '', { maxAge: 0 });
  return res;
}
