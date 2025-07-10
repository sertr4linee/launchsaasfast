import { NextRequest } from 'next/server';
import { ForgotPasswordSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { securityLogger } from '../../../../lib/security-logger';
import { SecurityEventType } from '../../../../types/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ForgotPasswordSchema.parse(body);

    // Extraction des informations device pour audit
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Demande de réinitialisation via Supabase
    const { data, error } = await supabaseServer.auth.resetPasswordForEmail(
      validatedData.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      }
    );

    if (error) {
      // Log failed password reset attempt
      await securityLogger.logAuth(SecurityEventType.PASSWORD_RESET_FAILED, request, {
        email: validatedData.email,
        error: error.message,
        authMethod: 'forgot_password',
      });
      
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return successResponse(
        { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' },
        'Demande de réinitialisation traitée'
      );
    }

    // Log successful password reset request
    await securityLogger.logAuth(SecurityEventType.PASSWORD_RESET_REQUESTED, request, {
      email: validatedData.email,
      authMethod: 'forgot_password',
    });

    // TODO: Rate limiting pour éviter les abus (Phase 3)
    
    return successResponse(
      { message: 'Un lien de réinitialisation a été envoyé à votre email' },
      'Email de réinitialisation envoyé'
    );

  } catch (error) {
    // Log API error
    await securityLogger.logError(error as Error, request, {
      endpoint: '/api/auth/forgot-password',
    });
    
    return handleError(error);
  }
}
