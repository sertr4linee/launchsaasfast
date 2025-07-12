'use client';

import { DeviceTable } from '@/components/security/device-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Monitor, AlertTriangle } from 'lucide-react';

export default function DevicesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      



      {/* Table des appareils */}
      <DeviceTable />
    </div>
  );
}
