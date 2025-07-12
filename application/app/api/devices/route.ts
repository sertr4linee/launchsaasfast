import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { handleError, successResponse } from '@/lib/error-handler';

// GET /api/devices - Lister les appareils de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    console.log('Attempting to get current user...');
    const { supabase } = createRouteHandlerClient(request);
    
    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User retrieved:', user ? `User ID: ${user.id}` : 'null');
    
    if (userError || !user) {
      console.log('User not authenticated, returning error');
      return handleError(new Error('Non authentifié'));
    }    console.log('Querying device sessions for user:', user.id);
    const { data: devices, error } = await supabase
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
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return handleError(new Error(error.message));
    }

    console.log('Found devices:', devices?.length || 0);    // Transformation des données pour correspondre au type DeviceSession
    const transformedDevices = devices.map((device: any) => ({
      id: device.id,
      userId: device.user_devices.user_id,
      deviceFingerprint: device.user_devices.fingerprint,
      confidenceScore: device.confidence_score,
      aalLevel: device.aal_level,
      isVerified: true, // On considère les sessions existantes comme vérifiées
      lastActivityAt: device.last_activity,
      expiresAt: null, // Pas d'expiration dans le schéma actuel
      createdAt: device.created_at,
      metadata: {
        userAgent: device.user_devices.user_agent,
        ipAddress: device.user_devices.ip_address,
        browser: device.user_devices.browser_name || device.user_devices.browser || 'Inconnu',
        os: device.user_devices.os_name || device.user_devices.os || 'Inconnu'
      },
    }));

    return successResponse(transformedDevices);
  } catch (error) {
    console.error('Error in GET /api/devices:', error);
    return handleError(error);
  }
}

// POST /api/devices - Créer une nouvelle session d'appareil
export async function POST(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);
    
    // Vérifier l'authentification
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return handleError(new Error('Non authentifié'));
    }

    const body = await request.json();
    const { confidenceScore, aalLevel, sessionToken } = body;
    const fingerprint = body.deviceFingerprint;

    // 1. Trouver ou créer le user_device
    let deviceId;
    const { data: existingDevice, error: deviceError } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('fingerprint', fingerprint)
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
          fingerprint,
        })
        .select('id')
        .single();
      if (newDeviceError) {
        return handleError(new Error(newDeviceError.message));
      }
      deviceId = newDevice.id;
    }

    // 2. Insérer la session d'appareil
    const { data: deviceSession, error } = await supabase
      .from('device_sessions')
      .insert({
        device_id: deviceId,
        user_id: user.id, // Ajouter l'user_id requis
        session_token: sessionToken || '',
        confidence_score: confidenceScore,
        aal_level: aalLevel,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return handleError(new Error(error.message));
    }

    return successResponse(deviceSession);
  } catch (error) {
    return handleError(error);
  }
}
