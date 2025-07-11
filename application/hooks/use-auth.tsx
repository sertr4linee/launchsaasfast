'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AuthenticationLevel } from '@/types/auth';
import { DeviceSession } from '@/types/device';

// Interface pour l'état d'authentification global
interface AuthState {
  user: User | null;
  session: Session | null;
  deviceSession: DeviceSession | null;
  loading: boolean;
  error: string | null;
  aal: AuthenticationLevel;
  deviceConfidence: number;
}

// Interface pour les fonctions d'authentification
interface AuthActions {
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  signout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  upgradeAAL: (factor: 'totp' | 'backup_code', code: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

// Type complet du contexte
interface AuthContextType extends AuthState, AuthActions {}

// Valeurs par défaut
const defaultAuthState: AuthState = {
  user: null,
  session: null,
  deviceSession: null,
  loading: true,
  error: null,
  aal: 'AAL1',
  deviceConfidence: 0,
};

const defaultAuthActions: AuthActions = {
  signin: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  signup: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  signout: async () => {},
  refreshSession: async () => {},
  upgradeAAL: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  clearError: () => {},
};

// Création du contexte
const AuthContext = createContext<AuthContextType>({
  ...defaultAuthState,
  ...defaultAuthActions,
});

// Hook pour utiliser le contexte d'authentification
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider d'authentification
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(defaultAuthState);
  const supabase = createClient();

  // Fonction utilitaire pour mettre à jour l'état
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Fonction pour récupérer la session device
  const fetchDeviceSession = useCallback(async (sessionToken?: string) => {
    if (!sessionToken) return null;
    
    try {
      const response = await fetch('/api/auth/device-session', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      
      if (response.ok) {
        const deviceSession = await response.json();
        return deviceSession;
      }
    } catch (error) {
      console.error('Error fetching device session:', error);
    }
    
    return null;
  }, []);

  // Fonction signin
  const signin = useCallback(async (email: string, password: string) => {
    try {
      updateState({ loading: true, error: null });

      // Appel à notre API custom qui gère le device session
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        // La session sera mise à jour via onAuthStateChange
        return { success: true };
      } else {
        updateState({ error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      updateState({ error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Fonction signup
  const signup = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      updateState({ loading: true, error: null });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          ...(metadata && { metadata })
        }),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      } else {
        updateState({ error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'inscription';
      updateState({ error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Fonction signout
  const signout = useCallback(async () => {
    try {
      updateState({ loading: true });
      
      // Signout côté client Supabase
      await supabase.auth.signOut();
      
      // Optionnel: appeler notre API pour nettoyer la session device
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error during server signout:', error);
      }

      // Réinitialiser l'état
      updateState({
        user: null,
        session: null,
        deviceSession: null,
        aal: 'AAL1',
        deviceConfidence: 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error during signout:', error);
      updateState({ loading: false });
    }
  }, [supabase.auth, updateState]);

  // Fonction refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      // La session sera mise à jour via onAuthStateChange
    } catch (error) {
      console.error('Error refreshing session:', error);
      updateState({ error: 'Erreur lors du rafraîchissement de la session' });
    }
  }, [supabase.auth, updateState]);

  // Fonction upgrade AAL
  const upgradeAAL = useCallback(async (factor: 'totp' | 'backup_code', code: string) => {
    try {
      updateState({ loading: true, error: null });

      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session?.access_token}`,
        },
        body: JSON.stringify({ 
          code, 
          type: factor === 'backup_code' ? 'backup' : 'totp' 
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateState({ 
          aal: 'AAL2',
          deviceSession: result.deviceSession 
        });
        return { success: true };
      } else {
        updateState({ error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de vérification 2FA';
      updateState({ error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      updateState({ loading: false });
    }
  }, [state.session?.access_token, updateState]);

  // Fonction clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Écoute des changements d'état d'authentification Supabase
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session) {
        // Récupérer la device session
        const deviceSession = await fetchDeviceSession(session.access_token);
        
        updateState({
          user: session.user,
          session,
          deviceSession,
          aal: deviceSession?.aalLevel === 2 ? 'AAL2' : 'AAL1',
          deviceConfidence: deviceSession?.confidenceScore || 0,
          loading: false,
          error: null,
        });
      } else if (event === 'SIGNED_OUT') {
        updateState({
          user: null,
          session: null,
          deviceSession: null,
          aal: 'AAL1',
          deviceConfidence: 0,
          loading: false,
          error: null,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        updateState({
          user: session.user,
          session,
          loading: false,
        });
      } else {
        updateState({ loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchDeviceSession, updateState]);

  // Initialisation de la session au montage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const deviceSession = await fetchDeviceSession(session.access_token);
          
          updateState({
            user: session.user,
            session,
            deviceSession,
            aal: deviceSession?.aalLevel === 2 ? 'AAL2' : 'AAL1',
            deviceConfidence: deviceSession?.confidenceScore || 0,
            loading: false,
          });
        } else {
          updateState({ loading: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        updateState({ loading: false, error: 'Erreur d\'initialisation' });
      }
    };

    initializeAuth();
  }, [supabase.auth, fetchDeviceSession, updateState]);

  // Valeur du contexte
  const contextValue: AuthContextType = {
    ...state,
    signin,
    signup,
    signout,
    refreshSession,
    upgradeAAL,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Export du contexte pour usage avancé
export { AuthContext };
