'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

interface Props {
  user: User | null;
}

export default function Header({ user }: Props) {
  return (
    <nav aria-label="Main navigation">
      <div className="mx-auto max-w-7xl relative px-[32px] py-[18px] flex items-center justify-between">
        <div className="flex flex-1 items-center justify-start">
          <Link className="flex items-center gap-2" href="/" aria-label="Tempcha home">
            {/* Simple text logo — matches dark theme foreground */}
            <span className="text-[20px] leading-none font-semibold tracking-[-0.3px]">
              Tempcha
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-8">
          {[
            { label: 'How it works', id: 'how-it-works' },
            { label: 'Use cases',    id: 'use-cases'    },
            { label: 'Pricing',      id: 'pricing'      },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="text-[14px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end">
          <div className="flex space-x-4">
            {user?.id ? (
              <Button variant="secondary" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/signup">Get started free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
