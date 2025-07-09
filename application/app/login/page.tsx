"use client";
import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Connexion réussie !");
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-4">Connexion</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
}
