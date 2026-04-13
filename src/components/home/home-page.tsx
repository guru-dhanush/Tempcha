'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUserInfo } from '@/hooks/useUserInfo';
import '../../styles/home-page.css';
import { LocalizationBanner } from '@/components/home/header/localization-banner';
import Header from '@/components/home/header/header';
import { HeroSection } from '@/components/home/hero-section/hero-section';
import { ExplainerSection } from '@/components/home/sections/explainer-section';
import { UseCasesSection } from '@/components/home/sections/use-cases-section';
import { HowItWorksSection } from '@/components/home/sections/how-it-works-section';
import { TrustSection } from '@/components/home/sections/trust-section';
import { Pricing } from '@/components/home/pricing/pricing';
import { HomePageBackground } from '@/components/gradients/home-page-background';
import { Footer } from '@/components/home/footer/footer';
import { Separator } from '@/components/ui/separator';

export function HomePage() {
  const supabase = createClient();
  const { user } = useUserInfo(supabase);
  const [country, setCountry] = useState('US');

  return (
    <>
      <LocalizationBanner country={country} onCountryChange={setCountry} />
      <div>
        <HomePageBackground />
        <Header user={user} />

        {/* Hero */}
        <HeroSection />

        {/* What is it — 3-point explainer */}
        <ExplainerSection />

        <Separator className="footer-border mx-auto max-w-7xl" />

        {/* Who is this for */}
        <div id="use-cases">
          <UseCasesSection />
        </div>

        <Separator className="footer-border mx-auto max-w-7xl" />

        {/* How it works */}
        <div id="how-it-works">
          <HowItWorksSection />
        </div>

        <Separator className="footer-border mx-auto max-w-7xl" />

        {/* Trust / Privacy */}
        <TrustSection />

        <Separator className="footer-border mx-auto max-w-7xl" />

        {/* Pricing */}
        <div id="pricing">
          <Pricing country={country} />
        </div>

        <Footer />
      </div>
    </>
  );
}
