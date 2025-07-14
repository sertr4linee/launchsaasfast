// Route API GET /api/auth/me
// Récupération des informations de l'utilisateur actuel

import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/middleware';
import { successResponse, handleAPIError } from '@/lib/api/responses';

export async function GET(request: NextRequest) {
  try {
    // 1. Récupération de l'utilisateur authentifié
    const { user } = await getAuthenticatedUser(request);

    // 2. Données utilisateur à retourner
    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.display_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return successResponse(userData, 'Informations utilisateur récupérées');
    
  } catch (error) {
    return handleAPIError(error);
  }
}

// Méthodes HTTP autorisées
export async function POST() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function PUT() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405 });
}
