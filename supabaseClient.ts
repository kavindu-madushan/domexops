import { createClient } from '@supabase/supabase-js';

// Attempt to read from common environment variable patterns (Vite, Process)
// This allows the app to work if keys are properly set in the environment.
const envUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL);
const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY);

// Fallback to hardcoded values if environment variables are missing
const projectUrl = envUrl || 'https://jzsmugzwjxdvzxwxhzgr.supabase.co';
const projectKey = envKey || 'sb_publishable_Eq0KTSBX1VkSYQkfrj5sOg_uWHG1n5l';

export const supabase = createClient(projectUrl, projectKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});