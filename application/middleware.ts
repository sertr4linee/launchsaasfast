import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from './lib/supabase/server';
import { getSessionByToken } from './lib/device-sessions';
import { extractDeviceInfo } from './lib/device-detection';

export async function middleware(request: NextRequest) {
  // Ordre de traitement: Auth → RateLimiting → Validation → BusinessLogic
  
  // Phase 1: Authentification
  const authResult = await withAuth(request);
  if (authResult.redirect) {
    return authResult.response;
  }

  // Phase 2: Rate Limiting (préparé pour Phase 3)
  // TODO: Implémenter rate limiting

  // Phase 3: Validation (gérée dans les routes API)
  // Phase 4: Business Logic (gérée dans les routes API)

  // Injecter les headers d'authentification
  if (authResult.userId && authResult.deviceSessionId) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', authResult.userId);
    requestHeaders.set('x-device-session-id', authResult.deviceSessionId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

interface AuthResult {
  userId?: string;
  deviceSessionId?: string;
  redirect?: boolean;
  response?: NextResponse;
}

/**
 * Middleware d'authentification JWT Supabase + device session
 */
async function withAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Extraire le token Authorization Bearer
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { redirect: false };
    }

    const token = authHeader.substring(7);

    // Valider le JWT Supabase
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    
    if (error || !user) {
      return {
        redirect: true,
        response: NextResponse.json(
          { success: false, error: 'Token invalide' },
          { status: 401 }
        )
      };
    }

    // Extraire les informations device
    const deviceInfo = extractDeviceInfo(
      request.headers.get('user-agent') || '',
      request.headers
    );

    // Chercher une session device active pour ce fingerprint
    // TODO: Améliorer la logique pour trouver la session par device + user
    const sessionToken = request.headers.get('x-session-token');
    let deviceSession = null;
    
    if (sessionToken) {
      deviceSession = await getSessionByToken(sessionToken);
      
      // Vérifier que la session n'est pas expirée
      if (deviceSession && deviceSession.expiresAt < new Date()) {
        deviceSession = null;
      }
    }

    return {
      userId: user.id,
      deviceSessionId: deviceSession?.id,
      redirect: false
    };

  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      redirect: true,
      response: NextResponse.json(
        { success: false, error: 'Erreur d\'authentification' },
        { status: 500 }
      )
    };
  }
}

// Configuration des routes protégées
export const config = {
  matcher: [
    // Protéger les routes API utilisateur
    '/api/user/:path*',
    // Protéger les routes admin
    '/api/admin/:path*',
    // Exclure les routes publiques
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};
