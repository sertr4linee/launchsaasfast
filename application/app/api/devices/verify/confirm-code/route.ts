import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleError, successResponse } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth-utils';

// POST /api/devices/verify/confirm-code - Vérifier le code de vérification
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return handleError(new Error('Non authentifié'));
    }

    const { deviceId, code } = await request.json();

    if (!deviceId || !code) {
      return handleError(new Error('ID d\'appareil et code requis'));
    }

    // Vérifier le code de vérification
    const { data: verificationCode, error: fetchError } = await supabaseServer
      .from('device_verification_codes')
      .select('*')
      .eq('device_session_id', deviceId)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationCode) {
      return handleError(new Error('Code de vérification invalide ou expiré'));
    }

    // Marquer le code comme utilisé
    const { error: updateCodeError } = await supabaseServer
      .from('device_verification_codes')
      .update({ used: true })
      .eq('id', verificationCode.id);

    if (updateCodeError) {
      console.error('Erreur mise à jour code:', updateCodeError);
    }

    // Mettre à jour l'appareil comme vérifié
    const { error: updateDeviceError } = await supabaseServer
      .from('device_sessions')
      .update({
        is_verified: true,
        confidence_score: Math.max(70, verificationCode.confidence_score || 70), // Au moins 70 si vérifié
        aal_level: 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId);

    if (updateDeviceError) {
      return handleError(new Error(updateDeviceError.message));
    }

    return successResponse({ 
      message: 'Appareil vérifié avec succès',
      verified: true 
    });
  } catch (error) {
    return handleError(error);
  }
}
