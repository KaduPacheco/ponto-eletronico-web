import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/infra/supabase/env";

const supabaseEnv = getSupabasePublicEnv();

// Singleton do Supabase para uso no CRM e autenticação.
// A landing continua usando fetch isolado para manter baixo bundle size no core.
export const supabase = createClient(supabaseEnv.url, supabaseEnv.anonKey);
