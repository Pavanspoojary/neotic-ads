import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vbipkwlpubecsswmbeom.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiaXBrd2xwdWJlY3Nzd21iZW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTUzODUsImV4cCI6MjEwNDM3MTM4NX0.pqfoKnVe0BodYTr8XoJVOvGynGWfPQMYVdaSARgVnBI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseClient(serviceRole = false) {
  const key = serviceRole && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : supabaseAnonKey;
  return createClient(supabaseUrl, key);
}
