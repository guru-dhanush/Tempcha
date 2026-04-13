'use client';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { signInWithGithub } from '@/app/login/actions';
import Image from 'next/image';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  label: string;
}

export function GhLoginButton({ label }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGithubSignIn() {
    setIsLoading(true);
    try {
      await signInWithGithub();
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={
        'mx-auto w-[343px] md:w-[488px] bg-background/80 backdrop-blur-[6px] px-6 md:px-16 pt-0 py-8 gap-6 flex flex-col items-center justify-center rounded-b-lg'
      }
    >
      <div className={'flex w-full items-center justify-center'}>
        <Separator className={'w-5/12 bg-border'} />
        <div className={'text-border text-xs font-medium px-4'}>or</div>
        <Separator className={'w-5/12 bg-border'} />
      </div>
      <Button
        onClick={handleGithubSignIn}
        variant={'secondary'}
        className={'w-full'}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Image
            height={24}
            width={24}
            className={'mr-3'}
            src="https://cdn.simpleicons.org/github/878989"
            unoptimized={true}
            alt={'GitHub logo'}
          />
        )}
        {label}
      </Button>
    </div>
  );
}
