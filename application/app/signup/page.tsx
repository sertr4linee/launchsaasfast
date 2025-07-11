import { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Inscription | LaunchSaasFast',
  description: 'Créez votre compte LaunchSaasFast pour commencer votre aventure.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Créer un compte
          </h1>
          <p className="text-muted-foreground mt-2">
            Rejoignez LaunchSaasFast et découvrez nos fonctionnalités
          </p>
        </div>
        
        <SignupForm />
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <a 
              href="/signin" 
              className="text-primary hover:text-primary/80 font-medium"
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
