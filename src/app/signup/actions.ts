'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

interface FormData {
  email: string;
  password: string;
}

export type SignupError =
  | 'email_taken'
  | 'weak_password'
  | 'too_many_requests'
  | 'unknown';

export type SignupResult =
  | { error: SignupError }
  | { emailConfirmationRequired: true }
  | undefined;

export async function signup(data: FormData): Promise<SignupResult> {
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signUp(data);

  if (error) {
    if (
      error.message.toLowerCase().includes('user already registered') ||
      error.code === 'user_already_exists'
    ) {
      return { error: 'email_taken' };
    }
    if (
      error.message.toLowerCase().includes('password') ||
      error.code === 'weak_password'
    ) {
      return { error: 'weak_password' };
    }
    if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
      return { error: 'too_many_requests' };
    }
    return { error: 'unknown' };
  }

  // Supabase requires email confirmation — session will be null
  if (authData.user && !authData.session) {
    return { emailConfirmationRequired: true };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
