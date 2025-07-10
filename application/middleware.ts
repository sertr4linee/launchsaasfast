import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from './lib/supabase/server';
import { getSessionByToken } from './lib/device-sessions';
import { extractDeviceInfo, getClientIP } from './lib/device-detection';
import { getRateLimiter } from './lib/rate-limiter';
import { getAALManager } from './lib/aal-manager';
import { securityLogger } from './lib/security-logger';
import { SecurityEventType } from './types/security';

export async function middleware(request: NextRequest) {
  // Ordre de traitement: Auth → RateLimiting → Validation → BusinessLogic
  
  // Phase 1: Authentification
  const authResult = await withAuth(request);
  if (authResult.redirect) {
    return authResult.response;
  }

  // Phase 2: Rate Limiting (préparé pour Phase 3)
  const rateLimitResult = await withRateLimit(request, authResult);
  if (rateLimitResult.blocked) {
    return rateLimitResult.response;
  }

  // Phase 3: Validation (gérée dans les routes API)
  // Phase 4: Business Logic (gérée dans les routes API)

  // Injecter les headers d'authentification et de rate limiting
  if (authResult.userId && authResult.deviceSessionId) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', authResult.userId);
    requestHeaders.set('x-device-session-id', authResult.deviceSessionId);
    requestHeaders.set('x-aal-level', String(authResult.aalLevel || 1));

    // Add rate limit headers if available
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        requestHeaders.set(key, String(value));
      });
    }

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
  confidenceScore?: number;
  aalLevel?: number;
  redirect?: boolean;
  response?: NextResponse;
}

interface RateLimitResult {
  blocked: boolean;
  response?: NextResponse;
  headers?: Record<string, string | number>;
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
      confidenceScore: deviceSession?.confidenceScore || 0,
      aalLevel: deviceSession?.aalLevel || 1,
      redirect: false
    };

  } catch (error) {
    // Log authentication error
    await securityLogger.logAuth(SecurityEventType.AUTH_FAILED, request, {
      error: error instanceof Error ? error.message : 'Unknown error',
      authMethod: 'middleware_bearer',
    });
    
    return {
      redirect: true,
      response: NextResponse.json(
        { success: false, error: 'Erreur d\'authentification' },
        { status: 500 }
      )
    };
  }
}

/**
 * Middleware de rate limiting adaptatif
 */
async function withRateLimit(request: NextRequest, authResult: AuthResult): Promise<RateLimitResult> {
  try {
    // Extract endpoint from pathname
    const endpoint = extractEndpoint(request.nextUrl.pathname);
    
    // Skip rate limiting for non-rate-limited endpoints
    if (!requiresRateLimit(endpoint)) {
      return { blocked: false };
    }

    // Determine identifier (user ID or IP address)
    const identifier = authResult.userId || getClientIP(request.headers);
    
    // Get confidence score from auth result
    const confidenceScore = authResult.confidenceScore || 0;

    // Check rate limit
    const rateLimiter = getRateLimiter();
    const result = await rateLimiter.checkLimit({
      endpoint,
      identifier,
      confidenceScore,
    });

    // Return headers for successful requests
    const headers: Record<string, number> = {
      'X-RateLimit-Limit': result.limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.reset,
    };

    if (!result.allowed) {
      // Add retry-after header for blocked requests
      if (result.retryAfter) {
        headers['Retry-After'] = result.retryAfter;
      }

      // Log rate limit violation
      await securityLogger.logAuth(SecurityEventType.RATE_LIMIT_EXCEEDED, request, {
        authMethod: 'middleware',
        metadata: {
          endpoint,
          identifier,
          limit: result.limit,
          confidenceScore,
        },
      });

      return {
        blocked: true,
        response: NextResponse.json(
          { 
            success: false, 
            error: 'Rate limit exceeded',
            limit: result.limit,
            remaining: result.remaining,
            retryAfter: result.retryAfter 
          },
          { 
            status: 429,
            headers: Object.fromEntries(
              Object.entries(headers).map(([k, v]) => [k, String(v)])
            )
          }
        )
      };
    }

    return { 
      blocked: false,
      headers: Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k, String(v)])
      )
    };

  } catch (error) {
    // Log rate limiting error
    await securityLogger.logAuth(SecurityEventType.AUTH_FAILED, request, {
      error: error instanceof Error ? error.message : 'Unknown error',
      authMethod: 'middleware_rate_limit',
      metadata: {
        component: 'middleware',
        function: 'withRateLimit',
      },
    });
    
    // Fail open - allow request if rate limiter fails
    return { blocked: false };
  }
}

/**
 * Extract endpoint name from pathname for rate limiting
 */
function extractEndpoint(pathname: string): string {
  // Match authentication endpoints
  if (pathname.includes('/api/auth/signin')) return 'signin';
  if (pathname.includes('/api/auth/signup')) return 'signup';
  if (pathname.includes('/api/auth/forgot-password')) return 'forgot-password';
  if (pathname.includes('/api/auth/verify-email')) return 'verify-email';
  if (pathname.includes('/api/auth/verify-2fa')) return 'verify-2fa';
  if (pathname.includes('/api/auth/setup-2fa')) return 'setup-2fa';
  
  // Default endpoint for other API calls
  return 'default';
}

/**
 * Check if endpoint requires rate limiting
 */
function requiresRateLimit(endpoint: string): boolean {
  const rateLimitedEndpoints = [
    'signin', 'signup', 'forgot-password', 
    'verify-email', 'verify-2fa', 'setup-2fa', 
    'default'
  ];
  return rateLimitedEndpoints.includes(endpoint);
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
    // Exclure les routes publiques (mais inclure auth pour rate limiting)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
