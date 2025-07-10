import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../../config';

const config = getConfig();
export const supabaseClient = createClient(config.dbUrl, process.env.SUPABASE_ANON_KEY!);
