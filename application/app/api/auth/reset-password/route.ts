import { NextRequest } from 'next/server';
import { ResetPasswordSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { securityLogger } from '../../../../lib/security-logger';
import { SecurityEventType } from '../../../../types/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ResetPasswordSchema.parse(body);

    // Extraction des informations device pour audit
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Vérification et mise à jour du mot de passe via Supabase
    const { data, error } = await supabaseServer.auth.updateUser({
      password: validatedData.password
    });

    if (error) {
      // Log failed password reset
      await securityLogger.logAuth(SecurityEventType.PASSWORD_RESET_FAILED, request, {
        error: error.message,
        authMethod: 'reset_password',
      });
      
      return handleError(new Error('Token invalide ou expiré'));
    }

    if (!data.user) {
      return handleError(new Error('Impossible de réinitialiser le mot de passe'));
    }

    // Log successful password reset
    await securityLogger.logAuth(SecurityEventType.PASSWORD_RESET_COMPLETED, request, {
      userId: data.user.id,
      authMethod: 'reset_password',
    });

    // Note: Email de confirmation de réinitialisation géré automatiquement par Supabase
    // Invalidation des sessions existantes pour sécurité peut être ajoutée ultérieurement

    return successResponse(
      { 
        message: 'Mot de passe réinitialisé avec succès',
        user_id: data.user.id 
      },
      'Mot de passe mis à jour'
    );

  } catch (error) {
    // Log security error
    await securityLogger.logAuth(SecurityEventType.PASSWORD_RESET_FAILED, request, {
      error: error instanceof Error ? error.message : 'Unknown error',
      authMethod: 'reset_password',
    });
    return handleError(error);
  }
}
