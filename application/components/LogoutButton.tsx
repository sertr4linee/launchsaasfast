"use client";
import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogout = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
    else setMessage("Déconnexion réussie.");
    setLoading(false);
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
      disabled={loading}
    >
      {loading ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
