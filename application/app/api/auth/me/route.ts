// Route API GET /api/auth/me
// Récupération des informations de l'utilisateur actuel

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { successResponse, handleAPIError } from '@/lib/api/responses';

export async function GET(request: NextRequest) {
  try {
    // Création du client Supabase avec gestion des cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {
            // Lecture seule pour cette route
          },
          remove() {
            // Lecture seule pour cette route
          },
        },
      }
    );
    
    // Récupérer l'utilisateur actuel
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Non authentifié', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Retourner les informations utilisateur
    return successResponse({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at
    }, 'Informations utilisateur récupérées');

  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
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
