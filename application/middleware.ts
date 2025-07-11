import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware simplifié compatible Edge Runtime
export async function middleware(request: NextRequest) {
  // Pour le moment, on laisse passer toutes les requêtes
  // Les vérifications complexes seront faites dans les routes API
  return NextResponse.next();
}

// Configuration des routes protégées
export const config = {
  matcher: [
    // Protéger les routes API utilisateur
    '/api/user/:path*',
    // Protéger les routes admin
    '/api/admin/:path*',
    // Appliquer rate limiting sur les routes d'authentification
    '/api/auth/:path*',
  ],
};
