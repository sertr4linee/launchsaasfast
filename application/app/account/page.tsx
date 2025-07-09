

"use client";
import { useSupabase } from "@/components/SupabaseProvider";
import { useState } from "react";

function EditProfileForm({ user }: { user: any }) {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState(user.email || "");
  const [name, setName] = useState(user.user_metadata?.name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    // Update email
    const { error: emailError } = await supabase.auth.updateUser({ email });
    // Update name (user_metadata)
    let metaError = null;
    if (name !== user.user_metadata?.name) {
      const { error } = await supabase.auth.updateUser({ data: { name } });
      metaError = error;
    }
    if (emailError || metaError) {
      setMessage("Erreur lors de la mise à jour : " + (emailError?.message || metaError?.message));
    } else {
      setMessage("Profil mis à jour !");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 p-4 rounded mb-8">
      <h2 className="text-lg font-semibold mb-2 text-gray-200">Modifier le profil</h2>
      <div className="mb-4">
        <label className="block text-gray-300 mb-1">Nom</label>
        <input
          type="text"
          className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-100"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Votre nom"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 mb-1">Email</label>
        <input
          type="email"
          className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-100"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Votre email"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Mise à jour..." : "Enregistrer"}
      </button>
      {message && <p className="mt-2 text-sm text-center">{message}</p>}
    </form>
  );
}

export default function AccountPage() {
  const { session } = useSupabase();
  const user = session?.user;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Basic information</h1>
        <form action="/logout" method="post">
          <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded">Se déconnecter</button>
        </form>
      </div>
      <div className="mb-8">
        {user ? (
          <div className="bg-gray-900 p-4 rounded mb-4">
            <div className="mb-2"><span className="font-semibold text-gray-300">User ID:</span> <span className="text-gray-200">{user.id}</span></div>
            <div className="mb-2"><span className="font-semibold text-gray-300">Email:</span> <span className="text-gray-200">{user.email}</span></div>
            <div className="mb-2"><span className="font-semibold text-gray-300">Status:</span> <span className="text-gray-200">{user.email_confirmed_at ? "Email confirmé" : "Non confirmé"}</span></div>
            <div className="mb-2"><span className="font-semibold text-gray-300">Créé le:</span> <span className="text-gray-200">{user.created_at ? new Date(user.created_at).toLocaleString() : "-"}</span></div>
          </div>
        ) : (
          <div className="text-red-400">Aucun utilisateur connecté.</div>
        )}
      </div>
      {/* Formulaire d'édition du nom/email */}
      {user && (
        <EditProfileForm user={user} />
      )}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-2 text-red-400">Delete account</h2>
        <div className="bg-gray-900 p-4 rounded mb-2">
          <p className="text-red-300 mb-2 font-medium">Important Information</p>
          <ul className="text-sm text-red-200 list-disc ml-6 mb-2">
            <li>All your personal information and settings will be permanently erased</li>
            <li>Your account cannot be recovered once deleted</li>
            <li>All your data will be removed from our servers</li>
          </ul>
          <button className="bg-red-600 text-white px-4 py-2 rounded mt-2">I understand, delete my account</button>
        </div>
      </div>
    </div>
  );
}
