'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

interface FormData {
  email: string;
  password: string;
}

export type LoginError =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'too_many_requests'
  | 'unknown';

export async function login(data: FormData): Promise<{ error: LoginError } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials') || error.code === 'invalid_credentials') {
      return { error: 'invalid_credentials' };
    }
    if (error.message.toLowerCase().includes('email not confirmed') || error.code === 'email_not_confirmed') {
      return { error: 'email_not_confirmed' };
    }
    if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
      return { error: 'too_many_requests' };
    }
    return { error: 'unknown' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signInWithGithub() {
  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:5000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectTo = `${protocol}://${host}/auth/callback`;

  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo },
  });

  if (data.url) {
    redirect(data.url);
  }
}

export async function loginAnonymously(): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
