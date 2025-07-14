// Adaptateur d'authentification API
// Interface compatible avec l'ancien client auth pour migration progressive

import { apiClient, APIError } from './client';
import type { SigninData, SignupData } from '@/lib/auth/schemas';

// Types compatibles avec l'ancien système
export interface AuthResponse {
  data: {
    user: any | null;
    session: any | null;
  };
  error: Error | null;
}

export interface UserResponse {
  data: {
    user: any | null;
  };
  error: Error | null;
}

// Fonction signIn compatible avec l'ancienne signature
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const result = await apiClient.post<any>('/auth/signin', {
      email,
      password
    });

    return {
      data: {
        user: result.user || null,
        session: result.session || null
      },
      error: null
    };
  } catch (error: any) {
    return {
      data: {
        user: null,
        session: null
      },
      error: error instanceof APIError ? new Error(error.message) : new Error(error?.message || 'Erreur de connexion')
    };
  }
};

// Fonction signUp compatible avec l'ancienne signature
export const signUp = async (email: string, password: string, name?: string): Promise<AuthResponse> => {
  try {
    const signupData: SignupData = {
      email,
      password,
      name: name || 'Utilisateur'
    };

    const result = await apiClient.post<any>('/auth/signup', signupData);

    return {
      data: {
        user: result.user || null,
        session: result.session || null
      },
      error: null
    };
  } catch (error: any) {
    return {
      data: {
        user: null,
        session: null
      },
      error: error instanceof APIError ? new Error(error.message) : new Error(error?.message || 'Erreur d\'inscription')
    };
  }
};

// Fonction signOut compatible avec l'ancienne signature
export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    await apiClient.post('/auth/signout');
    return { error: null };
  } catch (error: any) {
    return {
      error: error instanceof APIError ? new Error(error.message) : new Error(error?.message || 'Erreur de déconnexion')
    };
  }
};

// Fonction getCurrentUser compatible avec l'ancienne signature
export const getCurrentUser = async (): Promise<any | null> => {
  try {
    const result = await apiClient.get<any>('/auth/me');
    return result;
  } catch (error: any) {
    if (error instanceof APIError && error.status === 401) {
      return null; // Non authentifié
    }
    throw error;
  }
};

// Fonction getCurrentSession pour compatibilité
export const getCurrentSession = async (): Promise<any | null> => {
  try {
    const user = await getCurrentUser();
    return user ? { user } : null;
  } catch (error: any) {
    return null;
  }
};

// Fonction isAuthenticated compatible
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error: any) {
    return false;
  }
};

// Fonction refresh token
export const refreshSession = async (): Promise<AuthResponse> => {
  try {
    const result = await apiClient.post<any>('/auth/refresh');

    return {
      data: {
        user: result.user || null,
        session: result.session || null
      },
      error: null
    };
  } catch (error: any) {
    return {
      data: {
        user: null,
        session: null
      },
      error: error instanceof APIError ? new Error(error.message) : new Error(error?.message || 'Erreur de rafraîchissement')
    };
  }
};

// Export par défaut pour compatibilité
export default {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  refreshSession
};
