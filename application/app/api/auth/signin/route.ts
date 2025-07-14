// Route API POST /api/auth/signin
// Authentification utilisateur avec validation Zod

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { validateRequestBody } from '@/lib/api/middleware';
import { successResponse, handleAPIError } from '@/lib/api/responses';
import { signinSchema } from '@/lib/auth/schemas';

export async function POST(request: NextRequest) {
  try {
    // 1. Validation des données avec Zod
    const { email, password, remember } = await validateRequestBody(request, signinSchema);

    // 2. Préparation de la réponse pour gérer les cookies
    const response = NextResponse.json({ success: true });

    // 3. Création du client Supabase avec gestion des cookies
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

    // 4. Authentification avec Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return handleAPIError(new Error(error.message));
    }

    // 5. Réponse de succès avec données utilisateur
    const responseData = {
      user: data.user,
      session: data.session,
      message: 'Connexion réussie'
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Authentification réussie'
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
