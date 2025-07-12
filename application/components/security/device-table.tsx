'use client';

import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { DeviceConfidenceBadge } from './device-confidence-badge';
import { DeviceVerificationForm } from './device-verification-form';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

function getDeviceIcon(metadata?: Record<string, any>) {
  const deviceType = metadata?.browser?.toLowerCase() || '';
  if (deviceType.includes('mobile') || deviceType.includes('android') || deviceType.includes('iphone')) {
    return Smartphone;
  }
  if (deviceType.includes('tablet') || deviceType.includes('ipad')) {
    return Tablet;
  }
  return Monitor;
}

export function DeviceTable() {
  const { devices, loading, error, approveDevice, rejectDevice, revokeDevice } = useDeviceManagement();
  const [verifyingDevice, setVerifyingDevice] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 text-center">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Appareils Connectés ({devices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Appareil</TableHead>
              <TableHead>Confiance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernière Activité</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.metadata);
              const deviceName = device.metadata?.deviceName || device.metadata?.browser || 'Appareil inconnu';
              const browser = device.metadata?.browser || 'Navigateur inconnu';
              const os = device.metadata?.os || 'OS inconnu';
              const isActive = device.isVerified && new Date(device.expiresAt) > new Date();
              
              return (
                <TableRow key={device.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{deviceName}</div>
                        <div className="text-sm text-muted-foreground">
                          {browser} • {os}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DeviceConfidenceBadge score={device.confidenceScore} />
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={isActive ? 'default' : 'secondary'}
                      className={
                        isActive 
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    >
                      {isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(device.lastActivityAt), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!device.isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setVerifyingDevice(device.id)}
                          className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Vérifier
                        </Button>
                      )}
                      {device.confidenceScore < 70 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveDevice(device.id)}
                          className="h-8 px-2"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectDevice(device.id)}
                        className="h-8 px-2"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeDevice(device.id)}
                        className="h-8 px-2"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {devices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucun appareil connecté
          </div>
        )}
      </CardContent>
      
      {/* Modal de vérification */}
      {verifyingDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <DeviceVerificationForm
              deviceId={verifyingDevice}
              onVerificationComplete={() => {
                setVerifyingDevice(null);
                // Recharger les données
                window.location.reload();
              }}
            />
            <Button
              variant="outline"
              onClick={() => setVerifyingDevice(null)}
              className="w-full mt-4"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
