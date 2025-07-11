import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleError, successResponse } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth-utils';

// POST /api/devices/[id]/revoke - Révoquer un appareil
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

    // Supprimer la session d'appareil (révocation complète)
    const { error: deleteError } = await supabaseServer
      .from('device_sessions')
      .delete()
      .eq('id', deviceId);

    if (deleteError) {
      return handleError(new Error(deleteError.message));
    }

    return successResponse({ message: 'Appareil révoqué avec succès' });
  } catch (error) {
    return handleError(error);
  }
}
