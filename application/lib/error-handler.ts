import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { securityLogger } from './security-logger';
import { SecurityEventType } from '../types/security';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function handleError(error: unknown): NextResponse<APIResponse> {
  // Log API error using structured logging
  securityLogger.logEvent(SecurityEventType.ERROR_API, {
    error: error instanceof Error ? error.message : 'Unknown error',
    metadata: {
      operation: 'api_error_handler',
      errorType: error instanceof ZodError ? 'validation' : error instanceof Error ? 'application' : 'unknown',
      message: 'API error occurred',
    },
  }).catch(console.error); // Fallback to console.error for logging errors

  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      message: error.issues.map((e) => e.message).join(', ')
    }, { status: 400 });
  }

  if (error instanceof Error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }

  return NextResponse.json({
    success: false,
    error: 'Une erreur inattendue s\'est produite'
  }, { status: 500 });
}

export function successResponse<T>(data: T, message?: string): NextResponse<APIResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message
  });
}
