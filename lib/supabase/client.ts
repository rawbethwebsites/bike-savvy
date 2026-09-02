import { createClient } from '@supabase/supabase-js';
import type { Database } from '../booking/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for browser/server-side rendering (uses anon key)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client for server-side operations with full permissions (uses service role key)
export const supabaseAdmin = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : null;

// Helper to get the current user from Supabase Auth
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

// Helper to get the current user's dashboard profile
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  
  const { data: profile, error } = await supabase
    .from('dashboard_users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error || !profile) {
    return null;
  }
  
  return profile as { id: string; email: string; full_name: string; role: string };
}

// Helper to check if user has a specific role
export async function hasRole(requiredRole: string) {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return false;
  }
  
  const roleHierarchy: Record<string, number> = {
    'demo_viewer': 0,
    'instructor': 1,
    'operations_staff': 2,
    'owner': 3
  };
  
  const userRoleLevel = roleHierarchy[profile.role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
  
  return userRoleLevel >= requiredRoleLevel;
}
