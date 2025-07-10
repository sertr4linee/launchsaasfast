import { NextRequest } from 'next/server';
import { ChangePasswordSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { verify_user_password } from '../../../../lib/password-utils';

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
      console.log(`[SECURITY_AUDIT] Change password failed - user not found: ${userId} from ${clientIp}`);
      return handleError(new Error('Utilisateur non trouvé'));
    }

    // Vérification du mot de passe actuel avec verify_user_password pour maintenir AAL
    const passwordVerification = await verify_user_password(
      userData.user.email,
      validatedData.currentPassword
    );

    if (!passwordVerification.success) {
      console.log(`[SECURITY_AUDIT] Change password failed - invalid current password for ${userData.user.email} from ${clientIp}`);
      return handleError(new Error('Mot de passe actuel incorrect'));
    }

    // Mise à jour du mot de passe
    const { data, error } = await supabaseServer.auth.admin.updateUserById(
      userId,
      { password: validatedData.newPassword }
    );

    if (error) {
      console.log(`[SECURITY_AUDIT] Change password failed for ${userData.user.email} from ${clientIp}:`, error.message);
      return handleError(new Error('Impossible de changer le mot de passe'));
    }

    // Log de sécurité pour changement réussi
    console.log(`[SECURITY_AUDIT] Password changed successfully for ${userData.user.email} from ${clientIp} - ${userAgent} (device_session: ${deviceSessionId})`);

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
    // Log des erreurs pour audit de sécurité
    console.error('[SECURITY_AUDIT] Change password error:', error);
    return handleError(error);
  }
}
