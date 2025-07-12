import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleError, successResponse } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth-utils';
import { sendVerificationCode } from '@/lib/email-service';

// POST /api/devices/verify/send-code - Envoyer un code de vérification par email
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return handleError(new Error('Non authentifié'));
    }

    const { deviceId } = await request.json();

    // Vérifier que l'appareil appartient à l'utilisateur
    const { data: device, error: fetchError } = await supabaseServer
      .from('device_sessions')
      .select('*')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !device) {
      return handleError(new Error('Appareil non trouvé'));
    }

    // Générer un code de vérification à 6 chiffres
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Stocker le code dans la base de données
    const { error: insertError } = await supabaseServer
      .from('device_verification_codes')
      .insert({
        device_session_id: deviceId,
        code: verificationCode,
        confidence_score: Math.min(90, device.confidence_score + 20), // Augmenter le score après vérification
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('Erreur insertion code:', insertError);
      return handleError(new Error('Erreur lors de la génération du code'));
    }

    // Préparer les informations de l'appareil pour l'email
    const deviceInfo = {
      browser: device.metadata?.browser || 'Navigateur inconnu',
      os: device.metadata?.os || 'Système inconnu',
      location: device.location || undefined,
    };

    try {
      // Envoyer l'email avec le code de vérification
      await sendVerificationCode(user.email!, verificationCode, deviceInfo);
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      // En développement, on continue avec le code debug
      // En production, retourner une erreur
      if (process.env.NODE_ENV === 'production') {
        return handleError(new Error('Impossible d\'envoyer l\'email de vérification'));
      }
    }

    return successResponse({ 
      message: 'Code de vérification envoyé par email',
      // En mode debug uniquement - RETIRER EN PRODUCTION
      debug: process.env.NODE_ENV === 'development' ? { code: verificationCode } : undefined
    });
  } catch (error) {
    return handleError(error);
  }
}
