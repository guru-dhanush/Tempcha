'use client';

import Link from 'next/link';
import { CountryDropdown } from '@/components/home/header/country-dropdown';
import { ArrowUpRight, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  country: string;
  onCountryChange: (value: string) => void;
}

export function LocalizationBanner({ country, onCountryChange }: Props) {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <div className="hidden md:flex border-border/50 border-b-2 bg-background">
      <div className="flex flex-1 justify-center items-center p-2 gap-8">
        <div className="flex items-center gap-4">
          <p className="text-[14px] font-medium">
            🎉 Tempcha is now live — the temporary chat application for businesses
          </p>
          <Link className="text-[14px] text-muted-foreground" href="/signup">
            <span className="flex items-center gap-1">
              Start for free <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <CountryDropdown country={country} onCountryChange={onCountryChange} />
          <X size={16} className="cursor-pointer" onClick={() => setShow(false)} />
        </div>
      </div>
    </div>
  );
}
