'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import { signOut } from '../../supabaseAuth';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      setEmail(user.email || '');
      setFullName(user.user_metadata?.full_name || '');
      setLoading(false);
    };

    getUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/auth/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) {
        setMessage(`Erreur: ${error.message}`);
      } else {
        setMessage('Profil mis à jour avec succès!');
      }
    } catch (err) {
      setMessage('Une erreur inattendue s\'est produite');
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-500"
            >
              Se déconnecter
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.includes('Erreur') 
                ? 'bg-red-100 text-red-700 border border-red-400' 
                : 'bg-green-100 text-green-700 border border-green-400'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                L'email ne peut pas être modifié
              </p>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-black mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Votre nom complet"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={updating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {updating ? 'Mise à jour...' : 'Mettre à jour le profil'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Informations du compte</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">ID utilisateur:</span> {user?.id}</p>
              <p><span className="font-medium">Créé le:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
              <p><span className="font-medium">Dernière connexion:</span> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
              <p><span className="font-medium">Email confirmé:</span> {user?.email_confirmed_at ? 'Oui' : 'Non'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
