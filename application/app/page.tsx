import { Button, Card, CardContent, CardHeader, CardTitle, Container } from "@/components/ui";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="py-20">
        <main className="flex flex-col gap-16 items-center">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              LaunchSaasFast
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plateforme SaaS sécurisée avec authentification enterprise-grade, 
              vérification des appareils, et gestion des sessions avancée.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>🔐 Sécurité Enterprise</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Authentification 2FA, scoring de confiance des appareils, 
                  et conformité AAL NIST.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>📱 Gestion Appareils</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Détection automatique, vérification email, 
                  et monitoring des sessions en temps réel.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>⚡ Interface Moderne</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Design system Shadcn/ui, responsive, 
                  et expérience utilisateur optimisée.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <Button size="lg" asChild>
              <a href="/signin">Se connecter</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/signup">Créer un compte</a>
            </Button>
          </div>
        </main>
      </Container>
    </div>
  );
}
