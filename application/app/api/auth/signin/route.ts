// Route API POST /api/auth/signin
// Authentification utilisateur avec validation Zod

import { NextRequest } from 'next/server';
import { createSupabaseServerClient, validateRequestBody } from '@/lib/api/middleware';
import { successResponse, handleAPIError } from '@/lib/api/responses';
import { signinSchema } from '@/lib/auth/schemas';

export async function POST(request: NextRequest) {
  try {
    // 1. Validation des données avec Zod
    const { email, password, remember } = await validateRequestBody(request, signinSchema);

    // 2. Création du client Supabase
    const supabase = createSupabaseServerClient(request);

    // 3. Authentification avec Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return handleAPIError(new Error(error.message));
    }

    // 4. Réponse de succès avec données utilisateur
    const responseData = {
      user: data.user,
      session: data.session,
      message: 'Connexion réussie'
    };

    return successResponse(responseData, 'Authentification réussie');
    
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
