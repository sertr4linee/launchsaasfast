// Client-side authentication functions for LaunchSaasFast
// Refactored from supabaseAuth.ts to follow new structure

import { supabase } from '../../supabaseClient';
import type { User } from './types';

// Sign up function
export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password });
};

// Sign in function
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

// Sign out function
export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user as User | null;
};

// Get current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};
