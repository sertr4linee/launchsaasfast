import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { handleError, successResponse } from '@/lib/error-handler';

// GET /api/auth/device-session - Récupérer la session d'appareil actuelle
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);
    
    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return handleError(new Error('Non authentifié'));
    }

    // Récupérer la session d'appareil actuelle
    const { data: deviceSession, error } = await supabase
      .from('device_sessions')
      .select(`
        *,
        user_devices!inner(
          user_id,
          fingerprint,
          user_agent,
          ip_address
        )
      `)
      .eq('user_devices.user_id', user.id)
      .order('last_activity', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return handleError(new Error(error.message));
    }

    if (!deviceSession) {
      return successResponse(null);
    }

    // Transformer les données pour correspondre au type DeviceSession
    const transformedSession = {
      id: deviceSession.id,
      userId: deviceSession.user_devices.user_id,
      deviceFingerprint: deviceSession.user_devices.fingerprint,
      confidenceScore: deviceSession.confidence_score,
      aalLevel: deviceSession.aal_level,
      isVerified: true,
      lastActivityAt: deviceSession.last_activity,
      expiresAt: null,
      createdAt: deviceSession.created_at,
      metadata: {
        userAgent: deviceSession.user_devices.user_agent,
        ipAddress: deviceSession.user_devices.ip_address
      },
    };

    return successResponse(transformedSession);
  } catch (error) {
    console.error('Error in GET /api/auth/device-session:', error);
    return handleError(error);
  }
}

// POST /api/auth/device-session - Créer ou mettre à jour la session d'appareil actuelle
export async function POST(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);
    
    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return handleError(new Error('Non authentifié'));
    }

    const body = await request.json();
    const { deviceFingerprint, confidenceScore, aalLevel } = body;

    // 1. Trouver ou créer le user_device
    let deviceId;
    const { data: existingDevice, error: deviceError } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('fingerprint', deviceFingerprint)
      .single();

    if (deviceError && deviceError.code !== 'PGRST116') {
      return handleError(new Error(deviceError.message));
    }

    if (existingDevice) {
      deviceId = existingDevice.id;
    } else {
      // Créer le user_device si non existant
      const { data: newDevice, error: newDeviceError } = await supabase
        .from('user_devices')
        .insert({
          user_id: user.id,
          fingerprint: deviceFingerprint,
        })
        .select('id')
        .single();
      if (newDeviceError) {
        return handleError(new Error(newDeviceError.message));
      }
      deviceId = newDevice.id;
    }

    // Chercher une session existante pour ce device
    const { data: existingSession } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    let deviceSession;

    if (existingSession) {
      // Mettre à jour la session existante
      const { data, error } = await supabase
        .from('device_sessions')
        .update({
          confidence_score: confidenceScore,
          aal_level: aalLevel,
          last_activity: new Date().toISOString(),
        })
        .eq('id', existingSession.id)
        .select(`
          *,
          user_devices!inner(
            user_id,
            fingerprint,
            user_agent,
            ip_address
          )
        `)
        .single();

      if (error) {
        return handleError(new Error(error.message));
      }
      deviceSession = data;
    } else {
      // Créer une nouvelle session
      const { data, error } = await supabase
        .from('device_sessions')
        .insert({
          device_id: deviceId,
          user_id: user.id, // Ajouter l'user_id requis
          session_token: '',
          confidence_score: confidenceScore,
          aal_level: aalLevel,
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          user_devices!inner(
            user_id,
            fingerprint,
            user_agent,
            ip_address
          )
        `)
        .single();

      if (error) {
        return handleError(new Error(error.message));
      }
      deviceSession = data;
    }

    // Transformer les données
    const transformedSession = {
      id: deviceSession.id,
      userId: deviceSession.user_devices.user_id,
      deviceFingerprint: deviceSession.user_devices.fingerprint,
      confidenceScore: deviceSession.confidence_score,
      aalLevel: deviceSession.aal_level,
      isVerified: true,
      lastActivityAt: deviceSession.last_activity,
      expiresAt: null,
      createdAt: deviceSession.created_at,
      metadata: {
        userAgent: deviceSession.user_devices.user_agent,
        ipAddress: deviceSession.user_devices.ip_address
      },
    };

    return successResponse(transformedSession);
  } catch (error) {
    console.error('Error in POST /api/auth/device-session:', error);
    return handleError(error);
  }
}
