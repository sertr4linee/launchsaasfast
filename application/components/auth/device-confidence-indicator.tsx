'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { Shield, Smartphone, Monitor, AlertTriangle } from 'lucide-react';

interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
}

export function DeviceConfidenceIndicator() {
  const { deviceConfidence } = useAuth();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    // Détection basique de l'appareil côté client
    const detectDevice = (): DeviceInfo => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';
      if (/mobile|android|iphone|ipod/.test(userAgent)) {
        type = 'mobile';
      } else if (/ipad|tablet/.test(userAgent)) {
        type = 'tablet';
      }
      
      let browser = 'Unknown';
      if (userAgent.includes('chrome')) browser = 'Chrome';
      else if (userAgent.includes('firefox')) browser = 'Firefox';
      else if (userAgent.includes('safari')) browser = 'Safari';
      else if (userAgent.includes('edge')) browser = 'Edge';
      
      let os = 'Unknown';
      if (userAgent.includes('windows')) os = 'Windows';
      else if (userAgent.includes('mac')) os = 'macOS';
      else if (userAgent.includes('linux')) os = 'Linux';
      else if (userAgent.includes('android')) os = 'Android';
      else if (userAgent.includes('ios')) os = 'iOS';
      
      return { type, browser, os };
    };

    setDeviceInfo(detectDevice());
  }, []);

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return 'Élevée';
    if (score >= 60) return 'Moyenne';
    return 'Faible';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (!deviceInfo) return null;

  return (
    <div className="bg-muted/50 p-3 rounded-lg space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 text-primary" />
        Sécurité de l'appareil
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {getDeviceIcon(deviceInfo.type)}
          <span className="text-muted-foreground">
            {deviceInfo.browser} sur {deviceInfo.os}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`font-medium ${getConfidenceColor(deviceConfidence)}`}>
            Confiance: {getConfidenceLabel(deviceConfidence)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({deviceConfidence}%)
          </span>
        </div>
      </div>
      
      {deviceConfidence < 60 && (
        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Nouvel appareil détecté. Vous recevrez un email de vérification après connexion.
          </span>
        </div>
      )}
    </div>
  );
}
