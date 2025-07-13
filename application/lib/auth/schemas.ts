// Zod validation schemas for authentication API
// Strict validation according to shrimp-rules.md

import { z } from 'zod';

// Authentication schemas
export const signinSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  remember: z.boolean().optional()
});

export const signupSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    ),
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
});

export const profileUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .optional(),
  avatar_url: z.string().url('URL d\'avatar invalide').optional()
});

// Device verification schema
export const deviceVerificationSchema = z.object({
  code: z.string().length(6, 'Le code doit contenir exactement 6 chiffres'),
  deviceSessionId: z.string().uuid('ID de session device invalide')
});

// Type inference from schemas
export type SigninData = z.infer<typeof signinSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type DeviceVerificationData = z.infer<typeof deviceVerificationSchema>;
