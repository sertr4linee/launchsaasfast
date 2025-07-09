"use client";
import { useState } from "react";
import { supabase } from "../../utils/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Vérifie ta boîte mail pour confirmer ton inscription.");
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-4">Inscription</h1>
      <form onSubmit={handleRegister} className="space-y-4">
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
          {loading ? "Création..." : "S'inscrire"}
        </button>
      </form>
      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
}
