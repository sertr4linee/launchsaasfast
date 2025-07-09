
"use client";
import { useSupabase } from "@/components/SupabaseProvider";

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
      {/* Formulaire d'édition du nom/email à ajouter ici */}
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
