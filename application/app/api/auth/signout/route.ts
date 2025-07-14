// Route API POST /api/auth/signout
// Déconnexion utilisateur

import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/api/middleware';
import { successResponse, handleAPIError } from '@/lib/api/responses';

export async function POST(request: NextRequest) {
  try {
    // 1. Création du client Supabase
    const supabase = createSupabaseServerClient(request);

    // 2. Déconnexion avec Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return handleAPIError(new Error(error.message));
    }

    // 3. Réponse de succès
    const responseData = {
      message: 'Déconnexion réussie'
    };

    return successResponse(responseData, 'Utilisateur déconnecté');
    
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
