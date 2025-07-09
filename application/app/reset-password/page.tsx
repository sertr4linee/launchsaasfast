"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const access_token = searchParams.get("access_token");

  useEffect(() => {
    if (!access_token) setMessage("Lien invalide ou expiré.");
  }, [access_token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!access_token) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, access_token }),
      });
      const data = await res.json();
      if (!res.ok) setMessage(data.error || "Erreur inconnue");
      else {
        setMessage(data.message);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      setMessage("Erreur réseau ou serveur");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-4">Nouveau mot de passe</h1>
      <form onSubmit={handleReset} className="space-y-4">
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading || !access_token}
        >
          {loading ? "Mise à jour..." : "Réinitialiser"}
        </button>
      </form>
      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
}
