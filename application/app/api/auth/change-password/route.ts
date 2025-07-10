import { NextRequest } from 'next/server';
import { ChangePasswordSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { verify_user_password } from '../../../../lib/password-utils';
import { securityLogger } from '../../../../lib/security-logger';
import { SecurityEventType } from '../../../../types/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ChangePasswordSchema.parse(body);

    // Extraction des informations device pour audit
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Récupération de l'utilisateur authentifié depuis le middleware
    const userId = request.headers.get('x-user-id');
    const deviceSessionId = request.headers.get('x-device-session-id');

    if (!userId) {
      return handleError(new Error('Non authentifié'));
    }

    // Récupération des informations utilisateur
    const { data: userData, error: userError } = await supabaseServer.auth.admin.getUserById(userId);
    
    if (userError || !userData.user || !userData.user.email) {
      await securityLogger.logAuth(SecurityEventType.AUTH_FAILED, request, {
        userId,
        error: 'User not found during password change',
        authMethod: 'password_change',
      });
      return handleError(new Error('Utilisateur non trouvé'));
    }

    // Vérification du mot de passe actuel avec verify_user_password pour maintenir AAL
    const passwordVerification = await verify_user_password(
      userData.user.email,
      validatedData.currentPassword
    );

    if (!passwordVerification.success) {
      await securityLogger.logAuth(SecurityEventType.AUTH_FAILED, request, {
        userId,
        email: userData.user.email,
        error: 'Invalid current password during password change',
        authMethod: 'password_change',
      });
      return handleError(new Error('Mot de passe actuel incorrect'));
    }

    // Mise à jour du mot de passe
    const { data, error } = await supabaseServer.auth.admin.updateUserById(
      userId,
      { password: validatedData.newPassword }
    );

    if (error) {
      await securityLogger.logAuth(SecurityEventType.PASSWORD_RESET_FAILED, request, {
        userId,
        email: userData.user.email,
        error: error.message,
        authMethod: 'password_change',
      });
      return handleError(new Error('Impossible de changer le mot de passe'));
    }

    // Log successful password change
    await securityLogger.logAuth(SecurityEventType.PASSWORD_CHANGED, request, {
      userId,
      email: userData.user.email,
      authMethod: 'password_change',
      sessionId: deviceSessionId || undefined,
    });

    // TODO: Invalider toutes les autres sessions pour sécurité (Phase 3)
    // TODO: Envoyer notification email de changement de mot de passe

    return successResponse(
      { 
        message: 'Mot de passe changé avec succès',
        user_id: data.user.id 
      },
      'Mot de passe mis à jour'
    );

  } catch (error) {
    // Log API error
    await securityLogger.logError(error as Error, request, {
      endpoint: '/api/auth/change-password',
    });
    
    return handleError(error);
  }
}
