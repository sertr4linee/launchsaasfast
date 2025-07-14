// Route API POST /api/auth/signup
// Inscription utilisateur avec validation Zod

import { NextRequest } from 'next/server';
import { createSupabaseServerClient, validateRequestBody } from '@/lib/api/middleware';
import { successResponse, handleAPIError } from '@/lib/api/responses';
import { signupSchema } from '@/lib/auth/schemas';

export async function POST(request: NextRequest) {
  try {
    // 1. Validation des données avec Zod
    const { email, password, name } = await validateRequestBody(request, signupSchema);

    // 2. Création du client Supabase
    const supabase = createSupabaseServerClient(request);

    // 3. Inscription avec Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          display_name: name
        }
      }
    });

    if (error) {
      return handleAPIError(new Error(error.message));
    }

    // 4. Réponse de succès
    const responseData = {
      user: data.user,
      session: data.session,
      message: data.user?.email_confirmed_at 
        ? 'Compte créé avec succès' 
        : 'Compte créé. Vérifiez votre email pour activer votre compte.'
    };

    return successResponse(responseData, 'Inscription réussie');
    
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
