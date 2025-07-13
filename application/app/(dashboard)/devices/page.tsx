'use client';

import { useState } from 'react';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { DeviceTable } from '@/components/security/device-table';
import { DeviceConfidenceBadge } from '@/components/security/device-confidence-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Smartphone, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Activity,
  TrendingUp,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function DevicesPage() {
  const { 
    devices, 
    loading, 
    error, 
    refresh,
    getDeviceStats,
    getConfidenceLevel,
    getDevicesByLevel,
    isStale 
  } = useDeviceManagement();

  const [activeTab, setActiveTab] = useState('overview');
  const stats = getDeviceStats();

  // Calculer la répartition par confiance
  const confidenceDistribution = {
    trusted: getDevicesByLevel('trusted').length,
    verified: getDevicesByLevel('verified').length,
    restricted: getDevicesByLevel('restricted').length,
  };

  // Score de sécurité global
  const securityScore = devices.length > 0 
    ? Math.round(devices.reduce((acc, device) => acc + device.confidenceScore, 0) / devices.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Appareils</h1>
          <p className="text-muted-foreground">
            Surveillez et gérez tous les appareils connectés à votre compte.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isStale && (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              <Clock className="h-3 w-3 mr-1" />
              Données périmées
            </Badge>
          )}
          <Button
            onClick={() => refresh()}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appareils</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              appareils enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Sécurité</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}%</div>
            <Progress value={securityScore} className="w-full mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appareils Fiables</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confidenceDistribution.trusted}</div>
            <p className="text-xs text-muted-foreground">
              confiance ≥ 70%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accès Restreints</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{confidenceDistribution.restricted}</div>
            <p className="text-xs text-muted-foreground">
              confiance &lt; 40%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="devices">Tous les appareils</TabsTrigger>
          <TabsTrigger value="trusted">Fiables ({confidenceDistribution.trusted})</TabsTrigger>
          <TabsTrigger value="restricted">Restreints ({confidenceDistribution.restricted})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Security Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité Récente
                </CardTitle>
                <CardDescription>
                  Dernières connexions et événements de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                {devices.slice(0, 3).map((device) => (
                  <div key={device.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {device.metadata?.browser || 'Navigateur inconnu'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {device.metadata?.os || 'OS inconnu'}
                        </p>
                      </div>
                    </div>
                    <DeviceConfidenceBadge score={device.confidenceScore} />
                  </div>
                ))}
                {devices.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Aucun appareil enregistré
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analyse de Confiance
                </CardTitle>
                <CardDescription>
                  Répartition des niveaux de confiance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Fiables</span>
                    </div>
                    <span className="font-medium">{confidenceDistribution.trusted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm">Vérifiés</span>
                    </div>
                    <span className="font-medium">{confidenceDistribution.verified}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm">Restreints</span>
                    </div>
                    <span className="font-medium">{confidenceDistribution.restricted}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Session Info */}
          {stats.currentSession && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Session Actuelle
                </CardTitle>
                <CardDescription>
                  Informations sur votre appareil actuel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium">Appareil</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.currentSession.metadata?.browser} sur {stats.currentSession.metadata?.os}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Confiance</p>
                    <DeviceConfidenceBadge score={stats.currentSession.confidenceScore} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Niveau AAL</p>
                    <Badge variant="outline">AAL {stats.currentSession.aalLevel}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Tous les Appareils</CardTitle>
              <CardDescription>
                Gérez tous vos appareils connectés et leurs permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceTable showHeader={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trusted">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                Appareils Fiables
              </CardTitle>
              <CardDescription>
                Appareils avec un score de confiance élevé (≥ 70%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceTable filterLevel="trusted" showHeader={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restricted">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Appareils Restreints
              </CardTitle>
              <CardDescription>
                Appareils nécessitant une attention particulière (&lt; 40%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceTable filterLevel="restricted" showHeader={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
