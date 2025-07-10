import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function handleError(error: unknown): NextResponse<APIResponse> {
  console.error('API Error:', error);

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
