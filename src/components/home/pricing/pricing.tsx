import { Toggle } from '@/components/shared/toggle/toggle';
import { PriceCards } from '@/components/home/pricing/price-cards';
import { useEffect, useState } from 'react';
import { BillingFrequency, IBillingFrequency } from '@/constants/billing-frequency';
import { Environments, initializePaddle, Paddle } from '@paddle/paddle-js';
import { usePaddlePrices } from '@/hooks/usePaddlePrices';
import { SectionLabel } from '@/components/home/sections/section-label';
import { SectionHeading } from '@/components/home/sections/section-heading';
import { SectionSubtext } from '@/components/home/sections/section-subtext';

interface Props {
  country: string;
}

export function Pricing({ country }: Props) {
  const [frequency, setFrequency] = useState<IBillingFrequency>(BillingFrequency[0]);
  const [paddle, setPaddle]       = useState<Paddle | undefined>(undefined);
  const { prices, loading }       = usePaddlePrices(paddle, country);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && process.env.NEXT_PUBLIC_PADDLE_ENV) {
      initializePaddle({
        token:       process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
      }).then((p) => { if (p) setPaddle(p); });
    }
  }, []);

  return (
    <section
      aria-labelledby="pricing-heading"
      className="mx-auto max-w-7xl px-[32px] py-16 md:py-24"
    >
      {/* Section header — matches every other section */}
      <div className="text-center mb-12 md:mb-16">
        <SectionLabel>Simple pricing</SectionLabel>
        <SectionHeading>
          <h2 id="pricing-heading">Start free. Scale when you're ready.</h2>
        </SectionHeading>
        <div className="flex justify-center">
          <SectionSubtext>
            No credit card required to get started. Upgrade when you need more rooms,
            more participants, or more control.
          </SectionSubtext>
        </div>
      </div>

      {/* Toggle + cards */}
      <div className="flex flex-col items-center">
        <Toggle frequency={frequency} setFrequency={setFrequency} />
        <PriceCards frequency={frequency} loading={loading} priceMap={prices} />
      </div>
    </section>
  );
}
