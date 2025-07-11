'use client';

import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface DeviceConfidenceBadgeProps {
  score: number;
  className?: string;
}

export function DeviceConfidenceBadge({ score, className }: DeviceConfidenceBadgeProps) {
  const getConfidenceLevel = (score: number) => {
    if (score >= 70) {
      return {
        label: 'Approuvé',
        variant: 'default' as const,
        icon: ShieldCheck,
        className: 'bg-green-100 text-green-800 border-green-200',
      };
    } else if (score >= 40) {
      return {
        label: 'Vérifié',
        variant: 'secondary' as const,
        icon: Shield,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      };
    } else {
      return {
        label: 'Restreint',
        variant: 'destructive' as const,
        icon: ShieldAlert,
        className: 'bg-red-100 text-red-800 border-red-200',
      };
    }
  };

  const { label, icon: Icon, className: levelClassName } = getConfidenceLevel(score);

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 ${levelClassName} ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label} ({score}%)
    </Badge>
  );
}
