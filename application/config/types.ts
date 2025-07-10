// Types pour configuration
import { z } from 'zod';
import { EnvConfigSchema, BaseConfigSchema } from './schemas';
export type BaseConfig = z.infer<typeof BaseConfigSchema>;
export type EnvConfig = z.infer<typeof EnvConfigSchema>;
