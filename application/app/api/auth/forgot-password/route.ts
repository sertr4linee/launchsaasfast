import { NextRequest } from 'next/server';
import { ForgotPasswordSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';

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
      // Log de sécurité pour tentative de reset
      console.log(`[SECURITY_AUDIT] Forgot password attempt failed for ${validatedData.email} from ${clientIp}:`, error.message);
      
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return successResponse(
        { message: 'Si cet email existe, un lien de réinitialisation a été envoyé' },
        'Demande de réinitialisation traitée'
      );
    }

    // Log de sécurité pour demande valide
    console.log(`[SECURITY_AUDIT] Forgot password requested for ${validatedData.email} from ${clientIp} - ${userAgent}`);

    // TODO: Rate limiting pour éviter les abus (Phase 3)
    
    return successResponse(
      { message: 'Un lien de réinitialisation a été envoyé à votre email' },
      'Email de réinitialisation envoyé'
    );

  } catch (error) {
    // Log des erreurs pour audit de sécurité
    console.error('[SECURITY_AUDIT] Forgot password error:', error);
    return handleError(error);
  }
}
