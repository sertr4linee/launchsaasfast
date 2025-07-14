// Route API POST /api/auth/refresh
// Rafraîchissement du token d'authentification

import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/api/middleware';
import { successResponse, handleAPIError, unauthorizedResponse } from '@/lib/api/responses';

export async function POST(request: NextRequest) {
  try {
    // 1. Création du client Supabase
    const supabase = createSupabaseServerClient(request);

    // 2. Récupération de la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return unauthorizedResponse('Aucune session active à rafraîchir');
    }

    // 3. Rafraîchissement du token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token
    });

    if (error) {
      return handleAPIError(new Error(error.message));
    }

    // 4. Réponse de succès
    const responseData = {
      user: data.user,
      session: data.session,
      message: 'Token rafraîchi avec succès'
    };

    return successResponse(responseData, 'Session rafraîchie');
    
  } catch (error) {
    return handleAPIError(error);
  }
}

// Méthodes HTTP autorisées
export async function GET() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function PUT() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405 });
}
