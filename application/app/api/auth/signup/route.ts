import { NextRequest } from 'next/server';
import { SignupAPISchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { securityLogger } from '../../../../lib/security-logger';
import { SecurityEventType } from '../../../../types/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Debug logging
    console.log('Signup request body:', JSON.stringify(body, null, 2));
    
    const validatedData = SignupAPISchema.parse(body);

    // Extraction des informations device
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Inscription Supabase avec confirmation email automatique
    const { data, error } = await supabaseServer.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email`,
      }
    });

    if (error) {
      console.log('Supabase signup error:', error);
      
      // Log failed signup attempt
      await securityLogger.logAuth(SecurityEventType.AUTH_FAILED, request, {
        email: validatedData.email,
        error: error.message,
        authMethod: 'signup',
      });
      
      return handleError(new Error(error.message));
    }

    // Log successful signup
    await securityLogger.logAuth(SecurityEventType.AUTH_SIGNUP, request, {
      userId: data.user?.id,
      email: validatedData.email,
      authMethod: 'password',
    });

    // Note: Email de confirmation d'inscription envoyé automatiquement par Supabase
    // Création du profil utilisateur et enregistrement des informations device seront ajoutés ultérieurement

    return successResponse({
      user: data.user,
      session: data.session
    }, 'Inscription réussie');

  } catch (error) {
    console.log('Signup API error:', error);
    
    // Log API error
    await securityLogger.logError(error as Error, request, {
      endpoint: '/api/auth/signup',
    });
    
    return handleError(error);
  }
}
