'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignupSchema, type SignupRequest } from '@/schemas/auth';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { DeviceConfidenceIndicator } from '@/components/auth/device-confidence-indicator';

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { signup } = useAuth();
  
  const form = useForm<SignupRequest>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = form.watch('password');
  const watchConfirmPassword = form.watch('confirmPassword');

  // Validation en temps réel pour l'affichage visuel
  const passwordRequirements = [
    { label: 'Au moins 8 caractères', met: watchPassword?.length >= 8 },
    { label: 'Contient une majuscule', met: /[A-Z]/.test(watchPassword || '') },
    { label: 'Contient une minuscule', met: /[a-z]/.test(watchPassword || '') },
    { label: 'Contient un chiffre', met: /[0-9]/.test(watchPassword || '') },
  ];

  const passwordsMatch = watchPassword && watchConfirmPassword && watchPassword === watchConfirmPassword;

  const onSubmit = async (data: SignupRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signup(data.email, data.password);
      
      if (result.success) {
        setSuccess(true);
        // Redirection après inscription réussie
        setTimeout(() => {
          router.push('/signin?message=account-created');
        }, 2000);
      } else {
        setError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Compte créé avec succès !</h3>
            <p className="text-muted-foreground">
              Vous allez être redirigé vers la page de connexion.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Créer votre compte
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
                        placeholder="Choisissez un mot de passe sécurisé"
                        autoComplete="new-password"
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
                  {watchPassword && (
                    <div className="space-y-1 mt-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 
                            className={`h-3 w-3 ${req.met ? 'text-green-500' : 'text-muted-foreground'}`}
                          />
                          <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Répétez votre mot de passe"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  {watchConfirmPassword && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <CheckCircle2 
                        className={`h-3 w-3 ${passwordsMatch ? 'text-green-500' : 'text-muted-foreground'}`}
                      />
                      <span className={passwordsMatch ? 'text-green-600' : 'text-muted-foreground'}>
                        Les mots de passe correspondent
                      </span>
                    </div>
                  )}
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
              Créer mon compte
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              En créant un compte, vous acceptez nos{' '}
              <a href="/terms" className="text-primary hover:underline">
                conditions d&apos;utilisation
              </a>{' '}
              et notre{' '}
              <a href="/privacy" className="text-primary hover:underline">
                politique de confidentialité
              </a>
              .
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
