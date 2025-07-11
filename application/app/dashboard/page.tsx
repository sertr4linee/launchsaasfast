import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | LaunchSaasFast',
  description: 'Tableau de bord LaunchSaasFast',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue sur votre tableau de bord LaunchSaasFast !
        </p>
      </div>
    </div>
  );
}
