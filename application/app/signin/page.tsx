import { Metadata } from 'next';
import { SigninForm } from '@/components/auth/signin-form';

export const metadata: Metadata = {
  title: 'Connexion | LaunchSaasFast',
  description: 'Connectez-vous à votre compte LaunchSaasFast de manière sécurisée.',
};

export default function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Connexion
          </h1>
          <p className="text-muted-foreground mt-2">
            Accédez à votre espace LaunchSaasFast
          </p>
        </div>
        
        <SigninForm />
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <a 
              href="/signup" 
              className="text-primary hover:text-primary/80 font-medium"
            >
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
