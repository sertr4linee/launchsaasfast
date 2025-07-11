import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleError, successResponse } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth-utils';

// POST /api/devices/[id]/approve - Approuver un appareil
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return handleError(new Error('Non authentifié'));
    }

    const deviceId = params.id;

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

    // Mettre à jour le score de confiance et marquer comme vérifié
    const { error: updateError } = await supabaseServer
      .from('device_sessions')
      .update({
        confidence_score: 90, // Score élevé pour un appareil approuvé
        is_verified: true,
        aal_level: 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deviceId);

    if (updateError) {
      return handleError(new Error(updateError.message));
    }

    return successResponse({ message: 'Appareil approuvé avec succès' });
  } catch (error) {
    return handleError(error);
  }
}
