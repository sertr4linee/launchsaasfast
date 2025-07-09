"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" })
      .then(() => {
        router.replace("/login"); // Redirige vers la page de login après déconnexion
      });
  }, [router]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-lg text-gray-200 mb-4">Déconnexion en cours...</div>
    </div>
  );
}
