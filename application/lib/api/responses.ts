// Formats de réponse standardisés pour l'API REST
import { NextResponse } from 'next/server';

// Types pour les réponses API
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface APIError {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// Réponse de succès standardisée
export function successResponse<T>(
  data: T, 
  message?: string, 
  status: number = 200
): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

// Réponse d'erreur standardisée
export function errorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  const response: APIError = {
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

// Réponses prédéfinies pour les erreurs communes
export function unauthorizedResponse(message: string = 'Authentication required'): NextResponse {
  return errorResponse(
    'Unauthorized',
    message,
    401
  );
}

export function forbiddenResponse(message: string = 'Access forbidden'): NextResponse {
  return errorResponse(
    'Forbidden',
    message,
    403
  );
}

export function notFoundResponse(message: string = 'Resource not found'): NextResponse {
  return errorResponse(
    'Not Found',
    message,
    404
  );
}

export function validationErrorResponse(message: string): NextResponse {
  return errorResponse(
    'Validation Error',
    message,
    422
  );
}

export function rateLimitResponse(message: string = 'Too many requests'): NextResponse {
  return errorResponse(
    'Rate Limit Exceeded',
    message,
    429
  );
}

export function internalServerErrorResponse(message: string = 'Internal server error'): NextResponse {
  return errorResponse(
    'Internal Server Error',
    message,
    500
  );
}

// Gestion centralisée des erreurs API
export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Erreurs de validation ou d'authentification
    if (error.message.includes('Validation failed')) {
      return validationErrorResponse(error.message);
    }
    
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    if (error.message.includes('Rate limit')) {
      return rateLimitResponse();
    }

    // Erreur générique avec message
    return errorResponse('Request Failed', error.message, 400);
  }

  // Erreur inconnue
  return internalServerErrorResponse();
}
