import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: authError ?? new Error('Not authenticated') };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { data: null, error: profileError };
  }

  return { data: { user, profile }, error: null };
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
}

export async function updateUserProfile(
  userId: string,
  data: UserProfileUpdate
) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  return { data: profile, error };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: {
    first_name: string;
    last_name: string;
    organization_id: string;
  }
) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return { data, error };
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  return { error };
}

export async function resetPassword(email: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  return { data, error };
}

export async function createUserProfile(
  userId: string,
  data: Omit<UserProfileInsert, 'id'>
) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .insert({ ...data, id: userId })
    .select()
    .single();

  return { data: profile, error };
}
