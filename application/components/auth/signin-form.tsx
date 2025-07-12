'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SigninSchema, type SigninRequest } from '@/schemas/auth';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { DeviceConfidenceIndicator } from '@/components/auth/device-confidence-indicator';

export function SigninForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { signin } = useAuth();
  
  const form = useForm<SigninRequest>({
    resolver: zodResolver(SigninSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SigninRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signin(data.email, data.password);
      
      if (result.success) {
        // Enregistrer la session d'appareil
        try {
          const deviceFingerprint = window.navigator.userAgent + '_' + (window.crypto?.randomUUID?.() || Math.random().toString(36));
          const confidenceScore = 100; // valeur par défaut
          const aalLevel = 1; // valeur par défaut
          await fetch('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceFingerprint,
              confidenceScore,
              aalLevel,
            }),
          });
        } catch (e) {
          console.warn('Erreur lors de l’enregistrement de la session d’appareil:', e);
        }
        // Redirection après connexion réussie
        router.push('/dashboard');
      } else {
        setError(result.error || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('Signin error:', err);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Connexion sécurisée
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      autoComplete="email"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Votre mot de passe"
                        autoComplete="current-password"
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Device Confidence Indicator */}
            <DeviceConfidenceIndicator />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
            
            <div className="text-center">
              <a 
                href="/forgot-password" 
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Mot de passe oublié ?
              </a>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
