// Hook React pour l'authentification avec le nouveau client API
// Facilite l'utilisation dans les composants React

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, signIn, signOut, signUp } from './auth-client';
import type { AuthResponse } from './auth-client';

interface UseAuthReturn {
  user: any | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération initiale de l'utilisateur
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération de l\'utilisateur');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effet pour charger l'utilisateur au montage
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fonction de connexion
  const handleSignIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await signIn(email, password);
      
      if (response.error) {
        setError(response.error.message);
        setUser(null);
      } else {
        setUser(response.data.user);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la connexion';
      setError(errorMessage);
      setUser(null);
      return {
        data: { user: null, session: null },
        error: new Error(errorMessage)
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction d'inscription
  const handleSignUp = useCallback(async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);
      const response = await signUp(email, password, name);
      
      if (response.error) {
        setError(response.error.message);
        setUser(null);
      } else {
        setUser(response.data.user);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      setError(errorMessage);
      setUser(null);
      return {
        data: { user: null, session: null },
        error: new Error(errorMessage)
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction de déconnexion
  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await signOut();
      
      if (response.error) {
        setError(response.error.message);
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    refreshUser: fetchUser
  };
}

export default useAuth;
