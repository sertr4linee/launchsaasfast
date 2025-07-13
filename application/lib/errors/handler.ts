// Centralized error handling for LaunchSaasFast API
// Compliant with shrimp-rules.md security standards

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { APIError } from '../auth/types';

// Custom API Error class
export class APIErrorClass extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main error handler function
export function handleAPIError(error: unknown): NextResponse {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  // Log detailed error server-side (shrimp-rules.md requirement)
  console.error('API Error:', {
    requestId,
    timestamp,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    const apiError: APIError = {
      success: false,
      error: {
        code: 'validation_error',
        message: 'Données invalides',
        details: error.issues
      },
      meta: {
        timestamp,
        requestId
      }
    };
    return NextResponse.json(apiError, { status: 422 });
  }

  // Custom API errors
  if (error instanceof APIErrorClass) {
    const apiError: APIError = {
      success: false,
      error: {
        code: error.code,
        message: error.message
      },
      meta: {
        timestamp,
        requestId
      }
    };
    return NextResponse.json(apiError, { status: error.statusCode });
  }

  // Supabase authentication errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };
    
    switch (supabaseError.code) {
      case 'invalid_credentials':
        return NextResponse.json({
          success: false,
          error: {
            code: 'invalid_credentials',
            message: 'Email ou mot de passe incorrect'
          },
          meta: { timestamp, requestId }
        }, { status: 401 });
        
      case 'email_not_confirmed':
        return NextResponse.json({
          success: false,
          error: {
            code: 'email_not_verified',
            message: 'Veuillez vérifier votre email'
          },
          meta: { timestamp, requestId }
        }, { status: 401 });
        
      case 'signup_disabled':
        return NextResponse.json({
          success: false,
          error: {
            code: 'signup_disabled',
            message: 'L\'inscription est actuellement désactivée'
          },
          meta: { timestamp, requestId }
        }, { status: 403 });
    }
  }

  // Generic error (don't expose internal details - shrimp-rules.md)
  const apiError: APIError = {
    success: false,
    error: {
      code: 'internal_error',
      message: 'Une erreur interne est survenue'
    },
    meta: {
      timestamp,
      requestId
    }
  };
  
  return NextResponse.json(apiError, { status: 500 });
}

// HTTP status codes constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;
