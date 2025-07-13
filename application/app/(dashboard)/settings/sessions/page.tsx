'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  MapPin, 
  Monitor, 
  Smartphone, 
  Tablet,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Shield,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SecurityEvent {
  id: string;
  event_type: 'login' | 'logout' | 'password_change' | 'device_verification' | 'failed_login';
  ip_address: string;
  user_agent: string;
  location?: string;
  device_type: string;
  device_name?: string;
  success: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

interface DeviceSession {
  id: string;
  device_fingerprint: string;
  user_agent: string;
  ip_address: string;
  is_current: boolean;
  last_activity: string;
  created_at: string;
  confidence_score: number;
  aal_level: number;
  metadata?: Record<string, any>;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'login':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'logout':
      return <X className="h-4 w-4 text-gray-500" />;
    case 'failed_login':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'device_verification':
      return <Shield className="h-4 w-4 text-blue-500" />;
    case 'password_change':
      return <Shield className="h-4 w-4 text-orange-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getDeviceIcon = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="h-4 w-4" />;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return <Tablet className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
};

const getEventLabel = (eventType: string) => {
  const labels = {
    login: 'Connexion',
    logout: 'Déconnexion',
    failed_login: 'Tentative échouée',
    device_verification: 'Vérification appareil',
    password_change: 'Changement mot de passe'
  };
  return labels[eventType as keyof typeof labels] || eventType;
};

export default function SessionsPage() {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Charger les événements de sécurité
      const eventsResponse = await fetch('/api/user/security-events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setSecurityEvents(eventsData.data || []);
      }

      // Charger les sessions d'appareils
      const sessionsResponse = await fetch('/api/user/device-sessions');
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setDeviceSessions(sessionsData.data || []);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données de sécurité');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette session ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/device-sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeviceSessions(prev => prev.filter(session => session.id !== sessionId));
      } else {
        setError('Erreur lors de la révocation de la session');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const getBrowserInfo = (userAgent: string) => {
    // Extraction simplifiée du navigateur et OS depuis user agent
    const ua = userAgent.toLowerCase();
    
    let browser = 'Navigateur inconnu';
    let os = 'OS inconnu';
    
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios')) os = 'iOS';
    
    return { browser, os };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions et Activité</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sessions et Activité</h1>
        <p className="text-muted-foreground">
          Surveillez l'activité de votre compte et gérez vos sessions actives.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Sessions Actives ({deviceSessions.length})
          </CardTitle>
          <CardDescription>
            Appareils actuellement connectés à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deviceSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucune session active trouvée
            </p>
          ) : (
            <div className="space-y-4">
              {deviceSessions.map((session) => {
                const { browser, os } = getBrowserInfo(session.user_agent);
                const isCurrentSession = session.is_current;
                
                return (
                  <div 
                    key={session.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentSession ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {getDeviceIcon(session.user_agent)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {browser} sur {os}
                          </p>
                          {isCurrentSession && (
                            <Badge variant="default" className="text-xs">
                              Session actuelle
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.ip_address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Dernière activité: {formatDistanceToNow(new Date(session.last_activity), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Confiance: {Math.round(session.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!isCurrentSession && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                      >
                        Révoquer
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historique de Sécurité
          </CardTitle>
          <CardDescription>
            Événements récents liés à la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun événement de sécurité enregistré
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Événement</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityEvents.slice(0, 10).map((event) => {
                  const { browser, os } = getBrowserInfo(event.user_agent);
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.event_type)}
                          {getEventLabel(event.event_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(event.user_agent)}
                          <div>
                            <p className="text-sm">{browser}</p>
                            <p className="text-xs text-muted-foreground">{os}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {event.location || event.ip_address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(event.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.success ? 'default' : 'destructive'}>
                          {event.success ? 'Succès' : 'Échec'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Conseils de Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              Vérifiez régulièrement vos sessions actives et révoquez celles que vous ne reconnaissez pas
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              Activez l'authentification à deux facteurs pour une sécurité renforcée
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              Surveillez les tentatives de connexion suspectes dans l'historique
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              Déconnectez-vous toujours des appareils publics ou partagés
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
