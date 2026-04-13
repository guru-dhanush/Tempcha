'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AuthenticationForm } from '@/components/authentication/authentication-form';
import { signup, type SignupError } from '@/app/signup/actions';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MailCheck } from 'lucide-react';

const ERROR_MESSAGES: Record<SignupError, string> = {
  email_taken: 'An account with this email already exists. Try logging in instead.',
  weak_password: 'Password is too weak. Use at least 8 characters.',
  too_many_requests: 'Too many attempts. Please wait a moment and try again.',
  unknown: 'Something went wrong. Please try again.',
};

export function SignupForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      toast({ description: 'Please enter your email address.', variant: 'destructive' });
      return false;
    }
    if (!password) {
      toast({ description: 'Please enter a password.', variant: 'destructive' });
      return false;
    }
    if (password.length < 8) {
      toast({ description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return false;
    }
    return true;
  }

  async function handleSignup() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await signup({ email, password });
      if (result && 'error' in result) {
        toast({ description: ERROR_MESSAGES[result.error], variant: 'destructive' });
      } else if (result && 'emailConfirmationRequired' in result) {
        setEmailConfirmationSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (emailConfirmationSent) {
    return (
      <div className={'px-6 md:px-16 pb-6 py-8 gap-6 flex flex-col items-center justify-center text-center'}>
        <MailCheck className="h-16 w-16 text-green-500 mt-4" />
        <div className={'text-[24px] leading-[30px] font-medium tracking-[-0.6px]'}>
          Check your inbox
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We&apos;ve sent a confirmation link to <span className="text-white font-medium">{email}</span>.
          Click the link in the email to activate your account.
        </p>
        <p className="text-muted-foreground text-xs">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            className="text-white underline"
            onClick={() => setEmailConfirmationSent(false)}
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      action={'#'}
      onSubmit={(e) => { e.preventDefault(); handleSignup(); }}
      className={'px-6 md:px-16 pb-6 py-8 gap-6 flex flex-col items-center justify-center'}
    >
      <Image src={'/assets/icons/logo/aeroedit-icon.svg'} alt={'AeroEdit'} width={80} height={80} />
      <div className={'text-[30px] leading-[36px] font-medium tracking-[-0.6px] text-center'}>
        Create an account
      </div>
      <AuthenticationForm
        email={email}
        onEmailChange={setEmail}
        password={password}
        onPasswordChange={setPassword}
      />
      <p className="text-xs text-muted-foreground w-full text-left -mt-3">
        Use at least 8 characters for your password.
      </p>
      <Button
        type={'submit'}
        variant={'secondary'}
        className={'w-full'}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Sign up
      </Button>
    </form>
  );
}
