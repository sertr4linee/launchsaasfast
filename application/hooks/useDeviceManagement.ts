import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth.tsx';
import { DeviceSession, ConfidenceLevel } from '@/types/device';

interface DeviceAction {
  type: 'approve' | 'reject' | 'revoke';
  deviceId: string;
  reason?: string;
}

interface UseDeviceManagementResult {
  devices: DeviceSession[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  approveDevice: (deviceId: string, reason?: string) => Promise<void>;
  rejectDevice: (deviceId: string, reason?: string) => Promise<void>;
  revokeDevice: (deviceId: string, reason?: string) => Promise<void>;
  getDeviceStats: () => {
    total: number;
    trusted: number;
    verified: number;
    restricted: number;
    currentSession?: DeviceSession;
  };
  getConfidenceLevel: (score: number) => ConfidenceLevel;
  getDevicesByLevel: (level: ConfidenceLevel) => DeviceSession[];
  lastFetch: number;
  isStale: boolean;
}

export function useDeviceManagement(): UseDeviceManagementResult {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache duration: 30 seconds
  const CACHE_DURATION = 30000;

  const fetchDevices = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // Check cache unless forced refresh
    const now = Date.now();
    if (!forceRefresh && now - lastFetch < CACHE_DURATION && devices.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/devices', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDevices(data.data as DeviceSession[]);
        setLastFetch(now);
      } else {
        setError(data.error || 'Erreur lors du chargement des appareils');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, lastFetch, devices.length]);

  const performDeviceAction = useCallback(async (action: DeviceAction) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const response = await fetch(`/api/devices/${action.deviceId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.type,
          reason: action.reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchDevices(true);
        return data;
      } else {
        throw new Error(data.error || 'Erreur lors de l\'action sur l\'appareil');
      }
    } catch (error) {
      console.error('Erreur lors de l\'action sur l\'appareil:', error);
      throw error;
    }
  }, [user, fetchDevices]);

  const approveDevice = useCallback(async (deviceId: string, reason?: string) => {
    await performDeviceAction({ type: 'approve', deviceId, reason });
  }, [performDeviceAction]);

  const rejectDevice = useCallback(async (deviceId: string, reason?: string) => {
    await performDeviceAction({ type: 'reject', deviceId, reason });
  }, [performDeviceAction]);

  const revokeDevice = useCallback(async (deviceId: string, reason?: string) => {
    await performDeviceAction({ type: 'revoke', deviceId, reason });
  }, [performDeviceAction]);

  // Analytics helpers
  const getDeviceStats = useCallback(() => {
    const total = devices.length;
    const trusted = devices.filter(d => d.confidenceScore >= 70).length;
    const verified = devices.filter(d => d.confidenceScore >= 40 && d.confidenceScore < 70).length;
    const restricted = devices.filter(d => d.confidenceScore < 40).length;
    const currentSession = devices.find(d => d.metadata?.isCurrentSession);

    return {
      total,
      trusted,
      verified,
      restricted,
      currentSession,
    };
  }, [devices]);

  const getConfidenceLevel = useCallback((score: number): ConfidenceLevel => {
    if (score >= 70) return 'trusted';
    if (score >= 40) return 'verified';
    return 'restricted';
  }, []);

  const getDevicesByLevel = useCallback((level: ConfidenceLevel) => {
    return devices.filter(device => {
      const deviceLevel = getConfidenceLevel(device.confidenceScore);
      return deviceLevel === level;
    });
  }, [devices, getConfidenceLevel]);

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user, fetchDevices]);

  const isStale = Date.now() - lastFetch > CACHE_DURATION;

  return { 
    devices, 
    loading, 
    error, 
    refresh: () => fetchDevices(true), 
    approveDevice, 
    rejectDevice, 
    revokeDevice,
    getDeviceStats,
    getConfidenceLevel,
    getDevicesByLevel,
    lastFetch,
    isStale,
  };
}
