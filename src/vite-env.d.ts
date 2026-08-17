/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_LEAD_INTAKE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
