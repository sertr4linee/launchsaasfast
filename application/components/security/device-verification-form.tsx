'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Shield, Smartphone } from 'lucide-react';

interface DeviceVerificationFormProps {
  deviceId: string;
  onVerificationComplete?: () => void;
}

export function DeviceVerificationForm({ deviceId, onVerificationComplete }: DeviceVerificationFormProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendVerificationCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/devices/verify/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du code');
      }

      toast.success('Un code de vérification a été envoyé à votre adresse e-mail.');

      setStep('verify');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/devices/verify/confirm-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Code de vérification invalide');
      }

      toast.success('Votre appareil a été vérifié avec succès.');

      onVerificationComplete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          {step === 'request' ? (
            <Smartphone className="w-6 h-6 text-blue-600" />
          ) : (
            <Shield className="w-6 h-6 text-green-600" />
          )}
        </div>
        <CardTitle>
          {step === 'request' ? 'Vérifier cet appareil' : 'Entrer le code de vérification'}
        </CardTitle>
        <CardDescription>
          {step === 'request'
            ? 'Nous allons vous envoyer un code de vérification par e-mail pour sécuriser cet appareil.'
            : 'Entrez le code à 6 chiffres que vous avez reçu par e-mail.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'request' ? (
          <Button
            onClick={sendVerificationCode}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer le code de vérification
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-widest font-mono"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('request')}
                className="flex-1"
              >
                Renvoyer le code
              </Button>
              <Button
                onClick={verifyCode}
                disabled={isLoading || code.length !== 6}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vérifier
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
