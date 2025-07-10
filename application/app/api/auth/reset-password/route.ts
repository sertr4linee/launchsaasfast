import { NextRequest } from 'next/server';
import { ResetPasswordSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';

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
      // Log de sécurité pour tentative de reset échouée
      console.log(`[SECURITY_AUDIT] Password reset failed from ${clientIp}:`, error.message);
      
      return handleError(new Error('Token invalide ou expiré'));
    }

    if (!data.user) {
      return handleError(new Error('Impossible de réinitialiser le mot de passe'));
    }

    // Log de sécurité pour reset réussi
    console.log(`[SECURITY_AUDIT] Password reset successful for user ${data.user.id} from ${clientIp} - ${userAgent}`);

    // TODO: Invalider toutes les sessions existantes pour sécurité (Phase 3)
    // TODO: Envoyer notification email de changement de mot de passe

    return successResponse(
      { 
        message: 'Mot de passe réinitialisé avec succès',
        user_id: data.user.id 
      },
      'Mot de passe mis à jour'
    );

  } catch (error) {
    // Log des erreurs pour audit de sécurité
    console.error('[SECURITY_AUDIT] Reset password error:', error);
    return handleError(error);
  }
}
