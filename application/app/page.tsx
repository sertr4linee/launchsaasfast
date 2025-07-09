import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-auto text-center p-8">
        <CardHeader>
          <span className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Demo</span>
          <CardTitle className="text-4xl font-bold mb-2">Mazeway Demo</CardTitle>
          <CardDescription className="text-base mb-4">
            Drop in production-ready auth code with everything apps need
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-40 mx-auto">Try demo</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}