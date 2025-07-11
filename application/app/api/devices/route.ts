import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleError, successResponse } from '@/lib/error-handler';
import { getCurrentUser } from '@/lib/auth-utils';

// GET /api/devices - Lister les appareils de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return handleError(new Error('Non authentifié'));
    }

    const { data: devices, error } = await supabaseServer
      .from('device_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_activity_at', { ascending: false });

    if (error) {
      return handleError(new Error(error.message));
    }

    // Transformation des données pour correspondre au type DeviceSession
    const transformedDevices = devices.map(device => ({
      id: device.id,
      userId: device.user_id,
      deviceFingerprint: device.device_fingerprint,
      confidenceScore: device.confidence_score,
      aalLevel: device.aal_level,
      isVerified: device.is_verified,
      lastActivityAt: device.last_activity_at,
      expiresAt: device.expires_at,
      createdAt: device.created_at,
      metadata: device.metadata || {},
    }));

    return successResponse(transformedDevices);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/devices - Créer une nouvelle session d'appareil
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return handleError(new Error('Non authentifié'));
    }

    const body = await request.json();
    const { deviceFingerprint, confidenceScore, aalLevel, metadata } = body;

    const { data: device, error } = await supabaseServer
      .from('device_sessions')
      .insert({
        user_id: user.id,
        device_fingerprint: deviceFingerprint,
        confidence_score: confidenceScore,
        aal_level: aalLevel,
        is_verified: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      return handleError(new Error(error.message));
    }

    return successResponse(device);
  } catch (error) {
    return handleError(error);
  }
}
