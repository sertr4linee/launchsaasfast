import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../../config';

const config = getConfig();
export const supabaseServer = createClient(config.dbUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
