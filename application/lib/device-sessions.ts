import { supabaseServer } from './supabase/server';
import { DeviceInfo } from '../types/device';
import { compareDevices, ConfidenceLevel } from './confidence-scoring';
import { securityLogger } from './security-logger';
import { SecurityEventType } from '../types/security';

export interface DeviceSession {
  id: string;
  deviceId: string;
  sessionToken: string;
  confidenceScore: number;
  aalLevel: number;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateSessionParams {
  deviceId: string;
  sessionToken: string;
  confidenceScore: number;
  aalLevel: number;
  expiresIn?: number; // durée en secondes, défaut: 24h
}

// Session expirée après 24h d'inactivité
const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h en ms

/**
 * Créer une nouvelle session device
 */
export async function createDeviceSession(params: CreateSessionParams): Promise<DeviceSession | null> {
  const expiresAt = new Date(Date.now() + (params.expiresIn ? params.expiresIn * 1000 : DEFAULT_SESSION_DURATION));
  
  const { data, error } = await supabaseServer
    .from('device_sessions')
    .insert({
      device_id: params.deviceId,
      session_token: params.sessionToken,
      confidence_score: params.confidenceScore,
      aal_level: params.aalLevel,
      last_activity: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error || !data) {
    // Log device session creation error
    await securityLogger.logEvent(SecurityEventType.DEVICE_SESSION_CREATED, {
      error: error?.message || 'Failed to create device session',
      metadata: {
        operation: 'create_device_session',
        deviceId: params.deviceId,
        aalLevel: params.aalLevel,
        confidenceScore: params.confidenceScore,
        message: 'Error creating device session',
      },
    });
    return null;
  }

  return {
    id: data.id,
    deviceId: data.device_id,
    sessionToken: data.session_token,
    confidenceScore: data.confidence_score,
    aalLevel: data.aal_level,
    lastActivity: new Date(data.last_activity),
    createdAt: new Date(data.created_at),
    expiresAt: new Date(data.expires_at || expiresAt)
  };
}

/**
 * Mettre à jour la dernière activité d'une session
 */
export async function updateLastActivity(sessionId: string): Promise<boolean> {
  const { error } = await supabaseServer
    .from('device_sessions')
    .update({
      last_activity: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    // Log session activity update error
    await securityLogger.logEvent(SecurityEventType.DEVICE_SESSION_CREATED, {
      sessionId,
      error: error.message,
      metadata: {
        operation: 'update_last_activity',
        message: 'Error updating last activity',
      },
    });
    return false;
  }

  return true;
}

/**
 * Récupérer une session par son token
 */
export async function getSessionByToken(sessionToken: string): Promise<DeviceSession | null> {
  const { data, error } = await supabaseServer
    .from('device_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    deviceId: data.device_id,
    sessionToken: data.session_token,
    confidenceScore: data.confidence_score,
    aalLevel: data.aal_level,
    lastActivity: new Date(data.last_activity),
    createdAt: new Date(data.created_at),
    expiresAt: new Date(data.expires_at)
  };
}

/**
 * Supprimer une session
 */
export async function deleteDeviceSession(sessionId: string): Promise<boolean> {
  const { error } = await supabaseServer
    .from('device_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    // Log session deletion error
    await securityLogger.logEvent(SecurityEventType.DEVICE_SESSION_TERMINATED, {
      sessionId,
      error: error.message,
      metadata: {
        operation: 'delete_device_session',
        message: 'Error deleting device session',
      },
    });
    return false;
  }

  return true;
}

/**
 * Récupérer toutes les sessions d'un utilisateur
 */
export async function getUserSessions(userId: string): Promise<DeviceSession[]> {
  const { data, error } = await supabaseServer
    .from('device_sessions')
    .select(`
      *,
      user_devices!inner(user_id)
    `)
    .eq('user_devices.user_id', userId)
    .order('last_activity', { ascending: false });

  if (error || !data) {
    // Log error fetching user sessions
    await securityLogger.logEvent(SecurityEventType.DEVICE_SESSION_CREATED, {
      userId,
      error: error?.message || 'Failed to fetch user sessions',
      metadata: {
        operation: 'fetch_user_sessions',
        message: 'Error fetching user sessions',
      },
    });
    return [];
  }

  return data.map(row => ({
    id: row.id,
    deviceId: row.device_id,
    sessionToken: row.session_token,
    confidenceScore: row.confidence_score,
    aalLevel: row.aal_level,
    lastActivity: new Date(row.last_activity),
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at)
  }));
}

/**
 * Nettoyer les sessions expirées
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const { data, error } = await supabaseServer
    .from('device_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    // Log error cleaning up expired sessions
    await securityLogger.logEvent(SecurityEventType.DEVICE_SESSION_EXPIRED, {
      error: error.message,
      metadata: {
        operation: 'cleanup_expired_sessions',
        message: 'Error cleaning up expired sessions',
      },
    });
    return 0;
  }

  return data?.length || 0;
}

/**
 * Programmer le nettoyage automatique des sessions expirées
 * À exécuter toutes les heures
 */
export function scheduleSessionCleanup(): NodeJS.Timeout {
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 heure
  
  return setInterval(async () => {
    const deletedCount = await cleanupExpiredSessions();
    // Log successful cleanup
    await securityLogger.logEvent(SecurityEventType.DEVICE_SESSION_EXPIRED, {
      metadata: {
        operation: 'scheduled_session_cleanup',
        deletedCount,
        message: `Cleaned up ${deletedCount} expired sessions`,
      },
    });
  }, CLEANUP_INTERVAL);
}
