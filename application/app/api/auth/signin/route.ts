import { NextRequest } from 'next/server';
import { SigninSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { securityLogger } from '../../../../lib/security-logger';
import { SecurityEventType } from '../../../../types/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SigninSchema.parse(body);

    // Extraction des informations device
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Authentification Supabase
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      // Log failed authentication attempt
      await securityLogger.logAuth(SecurityEventType.AUTH_FAILED, request, {
        email: validatedData.email,
        error: error.message,
        authMethod: 'password',
      });
      
      return handleError(new Error(error.message));
    }

    // Log successful authentication
    await securityLogger.logAuth(SecurityEventType.AUTH_SIGNIN, request, {
      userId: data.user.id,
      email: validatedData.email,
      authMethod: 'password',
    });

    // TODO: Enregistrer device info et créer session

    return successResponse({
      user: data.user,
      session: data.session
    }, 'Connexion réussie');

  } catch (error) {
    // Log API error
    await securityLogger.logError(error as Error, request, {
      endpoint: '/api/auth/signin',
    });
    
    return handleError(error);
  }
}
