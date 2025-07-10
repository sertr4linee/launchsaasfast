// Types pour configuration
import { z } from 'zod';
import { BaseConfigSchema, EnvConfigSchema } from './schemas/index';
export type BaseConfig = z.infer<typeof BaseConfigSchema>;
export type EnvConfig = z.infer<typeof EnvConfigSchema>;
