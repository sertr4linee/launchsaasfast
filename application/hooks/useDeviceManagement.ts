import { useState, useEffect, useCallback } from 'react';
import { DeviceSession } from '@/types/device';

interface UseDeviceManagementResult {
  devices: DeviceSession[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  approveDevice: (deviceId: string) => Promise<void>;
  rejectDevice: (deviceId: string) => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
}

export function useDeviceManagement(): UseDeviceManagementResult {
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      if (res.ok && data.success) {
        setDevices(data.data as DeviceSession[]);
      } else {
        setError(data.error || 'Erreur lors du chargement des appareils');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveDevice = useCallback(async (deviceId: string) => {
    await fetch(`/api/devices/${deviceId}/approve`, { method: 'POST' });
    fetchDevices();
  }, [fetchDevices]);

  const rejectDevice = useCallback(async (deviceId: string) => {
    await fetch(`/api/devices/${deviceId}/reject`, { method: 'POST' });
    fetchDevices();
  }, [fetchDevices]);

  const revokeDevice = useCallback(async (deviceId: string) => {
    await fetch(`/api/devices/${deviceId}/revoke`, { method: 'POST' });
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return { devices, loading, error, refresh: fetchDevices, approveDevice, rejectDevice, revokeDevice };
}
