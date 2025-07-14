// Route API POST /api/auth/signout
// Déconnexion utilisateur

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { successResponse, handleAPIError } from '@/lib/api/responses';

export async function POST(request: NextRequest) {
  try {
    // 1. Préparation de la réponse pour gérer les cookies
    const response = NextResponse.json({ success: true });

    // 2. Création du client Supabase avec gestion des cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set(name, value, options);
          },
          remove(name: string, options: any) {
            response.cookies.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // 3. Déconnexion avec Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return handleAPIError(new Error(error.message));
    }

    // 4. Réponse de succès
    return NextResponse.json({
      success: true,
      data: { message: 'Déconnexion réussie' },
      message: 'Utilisateur déconnecté'
    }, { 
      status: 200,
      headers: response.headers
    });
    
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
