'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { login, type LoginError } from '@/app/login/actions';
import { useState } from 'react';
import { AuthenticationForm } from '@/components/authentication/authentication-form';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const ERROR_MESSAGES: Record<LoginError, string> = {
  invalid_credentials: 'Incorrect email or password. Please try again.',
  email_not_confirmed: 'Please confirm your email address before logging in. Check your inbox.',
  too_many_requests: 'Too many attempts. Please wait a moment and try again.',
  unknown: 'Something went wrong. Please try again.',
};

export function LoginForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      toast({ description: 'Please enter your email address.', variant: 'destructive' });
      return false;
    }
    if (!password) {
      toast({ description: 'Please enter your password.', variant: 'destructive' });
      return false;
    }
    return true;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsLoggingIn(true);
    try {
      const result = await login({ email, password });
      if (result?.error) {
        toast({ description: ERROR_MESSAGES[result.error], variant: 'destructive' });
      }
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <form
      action={'#'}
      onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
      className={'px-6 md:px-16 pb-6 py-8 gap-6 flex flex-col items-center justify-center'}
    >
      <Image src={'/assets/icons/logo/aeroedit-icon.svg'} alt={'AeroEdit'} width={80} height={80} />
      <div className={'text-[30px] leading-[36px] font-medium tracking-[-0.6px] text-center'}>
        Log in to your account
      </div>
      <AuthenticationForm
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
      />
      <Button
        type={'submit'}
        variant={'secondary'}
        className={'w-full'}
        disabled={isLoggingIn}
      >
        {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Log in
      </Button>
    </form>
  );
}
