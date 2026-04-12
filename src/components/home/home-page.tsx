'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUserInfo } from '@/hooks/useUserInfo';
import '../../styles/home-page.css';
import Header from '@/components/home/header/header';
import { HeroSection } from '@/components/home/hero-section/hero-section';
import { Pricing } from '@/components/home/pricing/pricing';
import { Footer } from '@/components/home/footer/footer';
import { LocalizationBanner } from '@/components/home/header/localization-banner';
import { HowItWorks } from '@/components/home/how-it-works';
import { UseCasesStrip } from '@/components/home/use-cases-strip';

export function HomePage() {
  const supabase = createClient();
  const { user } = useUserInfo(supabase);
  const [country, setCountry] = useState('US');

  return (
    <>
      <LocalizationBanner country={country} onCountryChange={setCountry} />
      <div style={{ background: 'hsl(224 30% 5%)' }}>
        <Header user={user} />
        <HeroSection />
        <HowItWorks />
        <UseCasesStrip />
        <div id="pricing">
          <Pricing country={country} />
        </div>
        <Footer />
      </div>
    </>
  );
}
