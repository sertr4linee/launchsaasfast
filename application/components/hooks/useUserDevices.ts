import { useCallback, useEffect, useState } from "react";

export interface UserDevice {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string;
  ip: string;
  current: boolean;
}

export function useUserDevices() {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch la liste des devices/sessions
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/devices");
      if (!res.ok) throw new Error("Erreur lors du chargement des devices");
      const data = await res.json();
      setDevices(data.sessions || []);
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Révoque une session/device
  const revokeDevice = useCallback(async (sessionId: string) => {
    setError(null);
    try {
      const res = await fetch("/api/account/devices/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la révocation");
      }
      // Si la session courante est révoquée, reload la page
      const { revoked } = await res.json();
      if (devices.find((d) => d.id === revoked && d.current)) {
        window.location.reload();
      } else {
        fetchDevices();
      }
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
    }
  }, [devices, fetchDevices]);

  return { devices, loading, error, refresh: fetchDevices, revokeDevice };
}
