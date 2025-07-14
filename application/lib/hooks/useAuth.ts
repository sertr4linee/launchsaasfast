'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, signOut as apiSignOut } from '@/lib/api/auth-client';

interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const checkAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const user = await getCurrentUser();
      setAuthState({
        user,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Erreur lors de la vérification d\'authentification:', error);
      setAuthState({
        user: null,
        loading: false,
        error: error.message || 'Erreur d\'authentification'
      });
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
      setAuthState({
        user: null,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      setAuthState(prev => ({
        ...prev,
        error: error.message || 'Erreur de déconnexion'
      }));
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    signOut,
    refreshUser
  };
}
