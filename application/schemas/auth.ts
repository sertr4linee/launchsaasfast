import { z } from 'zod';

export const SigninSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

export const SignupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(8, 'Mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Nouveau mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const Setup2FASchema = z.object({
  // No input required for setup, user must be authenticated
});

export const Verify2FASchema = z.object({
  token: z.string()
    .min(6, 'Code trop court')
    .max(8, 'Code trop long')
    .regex(/^[A-Z0-9\s-]+$/i, 'Format de code invalide'),
  isBackupCode: z.boolean().optional().default(false),
});

export const Disable2FASchema = z.object({
  password: z.string().min(1, 'Mot de passe requis pour désactiver 2FA'),
});

export type SigninRequest = z.infer<typeof SigninSchema>;
export type SignupRequest = z.infer<typeof SignupSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
export type Setup2FARequest = z.infer<typeof Setup2FASchema>;
export type Verify2FARequest = z.infer<typeof Verify2FASchema>;
export type Disable2FARequest = z.infer<typeof Disable2FASchema>;
