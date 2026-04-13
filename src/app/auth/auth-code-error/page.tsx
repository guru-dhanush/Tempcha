import { LoginGradient } from '@/components/gradients/login-gradient';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCodeErrorPage() {
  return (
    <div>
      <LoginGradient />
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="bg-background/80 backdrop-blur-[6px] rounded-lg border border-border p-10 max-w-md w-full flex flex-col items-center gap-5">
          <ShieldAlert className="h-14 w-14 text-destructive" />
          <h1 className="text-[24px] leading-[30px] font-medium tracking-[-0.6px]">
            Authentication failed
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Something went wrong during sign-in. The link may have expired, already been used, or
            was invalid. Please try again.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/login">Back to log in</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/signup">Create an account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
