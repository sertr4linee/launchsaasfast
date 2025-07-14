// Utilitaires middleware pour validation et authentification
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import type { User } from '@/lib/auth/types';

// Client Supabase pour le serveur
export function createSupabaseServerClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {
          // Pas d'écriture de cookies dans les utilitaires
        },
        remove() {
          // Pas de suppression de cookies dans les utilitaires
        },
      },
    }
  );
}

// Récupération de l'utilisateur authentifié
export async function getAuthenticatedUser(request: NextRequest): Promise<{ user: any }> {
  const supabase = createSupabaseServerClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return { user };
}

// Validation avec Zod et gestion d'erreurs
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw new Error('Invalid JSON body');
  }
}

// Rate limiting simple (en mémoire)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(request: NextRequest, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  
  const current = requestCounts.get(ip);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

// Nettoyage périodique du cache de rate limiting
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Nettoyage toutes les 5 minutes
