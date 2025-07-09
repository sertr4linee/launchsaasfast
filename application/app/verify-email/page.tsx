"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.substring(1); // retire le #
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const type = params.get("type");
      if (access_token && type === "signup") {
        setMessage("Ton email a bien été vérifié ! Tu peux maintenant te connecter.");
        setLoading(false);
        setTimeout(() => router.push("/login"), 2000);
        return;
      }
    }
    setMessage("Lien de vérification invalide ou expiré.");
    setLoading(false);
  }, [router]);

  return (
    <div className="max-w-sm mx-auto mt-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Vérification email</h1>
      {loading ? <p>Vérification en cours...</p> : <p>{message}</p>}
    </div>
  );
}
