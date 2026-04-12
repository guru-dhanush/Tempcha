import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface Props {
  user: User | null;
}

export default function Header({ user }: Props) {
  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
        <Link className="flex items-center gap-2" href="/">
          <div className="w-8 h-8 rounded-lg flash-gradient flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            Flash<span className="glow-text">Room</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#usecases" className="hover:text-foreground transition-colors">Use Cases</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
        </div>

        <div className="flex items-center gap-3">
          {user?.id ? (
            <Button asChild className="flash-gradient text-white border-0 hover:opacity-90">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="flash-gradient text-white border-0 hover:opacity-90">
                <Link href="/signup">Get started free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
