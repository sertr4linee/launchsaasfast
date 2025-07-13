
'use client';

import { useAuth } from '@/hooks/use-auth.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  User, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Smartphone,
  Lock,
  TrendingUp
} from 'lucide-react';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Metadata } from 'next';

export default function DashboardPage() {
  const { user, deviceConfidence, aal, deviceSession } = useAuth();
  const { devices, loading } = useDeviceManagement();

  // Calcul des métriques de sécurité
  const trustedDevices = devices.filter(d => d.isVerified).length;
  const totalDevices = devices.length;
  const lastActivity = deviceSession?.lastActivityAt ? new Date(deviceSession.lastActivityAt) : null;
  
  // Score de sécurité global (basé sur AAL, confidence, devices)
  const securityScore = Math.round(
    (aal === 'AAL2' ? 40 : 20) + // AAL level
    (deviceConfidence * 30) + // Device confidence
    (trustedDevices / Math.max(totalDevices, 1) * 30) // Trusted devices ratio
  );

  const getSecurityLevel = (score: number) => {
    if (score >= 80) return { level: 'Élevé', color: 'bg-green-500', variant: 'default' as const };
    if (score >= 60) return { level: 'Moyen', color: 'bg-yellow-500', variant: 'secondary' as const };
    return { level: 'Faible', color: 'bg-red-500', variant: 'destructive' as const };
  };

  const securityLevel = getSecurityLevel(securityScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue {user?.email}, voici un aperçu de votre sécurité.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Sécurité</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={securityScore} className="flex-1" />
              <Badge variant={securityLevel.variant}>{securityLevel.level}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niveau d'Auth</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aal}</div>
            <p className="text-xs text-muted-foreground">
              {aal === 'AAL2' ? 'Authentification renforcée' : 'Authentification standard'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appareils</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trustedDevices}/{totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Appareils de confiance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance Appareil</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(deviceConfidence * 100)}%</div>
            <Progress value={deviceConfidence * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes de Sécurité
            </CardTitle>
            <CardDescription>
              Recommandations pour améliorer votre sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aal === 'AAL1' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Authentification 2FA recommandée</AlertTitle>
                <AlertDescription>
                  Activez l'authentification à deux facteurs pour une sécurité renforcée.
                </AlertDescription>
              </Alert>
            )}
            
            {deviceConfidence < 0.7 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Confiance appareil faible</AlertTitle>
                <AlertDescription>
                  Votre appareil actuel a un score de confiance faible. Vérifiez votre appareil.
                </AlertDescription>
              </Alert>
            )}

            {totalDevices > trustedDevices && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Appareils non vérifiés</AlertTitle>
                <AlertDescription>
                  Vous avez {totalDevices - trustedDevices} appareil(s) non vérifié(s).
                </AlertDescription>
              </Alert>
            )}

            {aal === 'AAL2' && deviceConfidence >= 0.7 && totalDevices === trustedDevices && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Sécurité optimale</AlertTitle>
                <AlertDescription>
                  Votre configuration de sécurité est excellente !
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité Récente
            </CardTitle>
            <CardDescription>
              Dernières actions sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Connexion réussie</p>
                  <p className="text-xs text-muted-foreground">
                    {lastActivity ? formatDistanceToNow(lastActivity, { 
                      addSuffix: true, 
                      locale: fr 
                    }) : 'Maintenant'}
                  </p>
                </div>
              </div>
              
              {deviceSession && (
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Session appareil créée</p>
                    <p className="text-xs text-muted-foreground">
                      Score: {Math.round(deviceSession.confidenceScore * 100)}%
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-gray-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Profil mis à jour</p>
                  <p className="text-xs text-muted-foreground">
                    Il y a 2 jours
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>
            Gérez rapidement vos paramètres de sécurité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <a 
              href="/settings" 
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Lock className="h-5 w-5" />
              <div>
                <p className="font-medium">Paramètres de Sécurité</p>
                <p className="text-sm text-muted-foreground">Configurer 2FA</p>
              </div>
            </a>
            
            <a 
              href="/devices" 
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Smartphone className="h-5 w-5" />
              <div>
                <p className="font-medium">Gérer les Appareils</p>
                <p className="text-sm text-muted-foreground">Voir tous les appareils</p>
              </div>
            </a>
            
            <a 
              href="/settings" 
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <User className="h-5 w-5" />
              <div>
                <p className="font-medium">Profil Utilisateur</p>
                <p className="text-sm text-muted-foreground">Modifier vos informations</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
