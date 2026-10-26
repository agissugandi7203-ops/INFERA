import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Retrieves the active Supabase JWT Bearer header for backend API requests.
 * Returns an empty object if no active session exists.
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  if (!client) return {};
  try {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // Ignore session read error
  }
  return {};
};
