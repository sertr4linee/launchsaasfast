import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleError, successResponse } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth-utils';

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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Stocker le code dans la base de données
    const { error: insertError } = await supabaseServer
      .from('device_verification_codes')
      .insert({
        device_session_id: deviceId,
        code: verificationCode,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('Erreur insertion code:', insertError);
      return handleError(new Error('Erreur lors de la génération du code'));
    }

    // TODO: Envoyer l'email avec le code de vérification
    // Pour le moment, nous retournons le code dans la réponse (à supprimer en production)
    console.log(`Code de vérification pour l'appareil ${deviceId}: ${verificationCode}`);

    return successResponse({ 
      message: 'Code de vérification envoyé par email',
      // Retirer cette ligne en production :
      debugCode: verificationCode 
    });
  } catch (error) {
    return handleError(error);
  }
}
