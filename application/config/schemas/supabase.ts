import { z } from 'zod';
import { BaseConfigSchema } from '../schemas';

export const SupabaseEnvSchema = BaseConfigSchema.extend({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
});
