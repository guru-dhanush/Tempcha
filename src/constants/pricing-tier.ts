export interface Tier {
  name: string;
  id: 'starter' | 'pro' | 'advanced';
  icon: string;
  description: string;
  features: string[];
  featured: boolean;
  priceId: Record<string, string>;
  limit: string;
  color: string;
}

export const PricingTier: Tier[] = [
  {
    name: 'Starter',
    id: 'starter',
    icon: '/assets/icons/price-tiers/free-icon.svg',
    description: 'Perfect for small venues testing the waters.',
    features: [
      '1 permanent QR code',
      'Up to 20 participants per session',
      '2-hour max session length',
      'Anonymous aliases',
      'FlashRoom branding',
    ],
    featured: false,
    priceId: { month: 'pri_01hsxyh9txq4rzbrhbyngkhy46', year: 'pri_01hsxyh9txq4rzbrhbyngkhy46' },
    limit: 'Free forever',
    color: 'from-slate-500 to-slate-600',
  },
  {
    name: 'Business',
    id: 'pro',
    icon: '/assets/icons/price-tiers/basic-icon.svg',
    description: 'For growing businesses with multiple locations.',
    features: [
      '5 permanent QR codes',
      'Up to 100 participants per session',
      '12-hour session length',
      'Custom welcome message',
      'Basic analytics dashboard',
      'Email support',
    ],
    featured: true,
    priceId: { month: 'pri_01hsxycme6m95sejkz7sbz5e9g', year: 'pri_01hsxyeb2bmrg618bzwcwvdd6q' },
    limit: '$29 / month',
    color: 'from-purple-600 to-blue-600',
  },
  {
    name: 'Enterprise',
    id: 'advanced',
    icon: '/assets/icons/price-tiers/pro-icon.svg',
    description: 'Unlimited power for chains, venues and institutions.',
    features: [
      'Unlimited QR codes',
      'Up to 500 participants per session',
      'Unlimited session length',
      'Custom branding & logo',
      'Full analytics + export',
      'Moderation controls',
      'Priority support',
      'API access',
    ],
    featured: false,
    priceId: { month: 'pri_01hsxyff091kyc9rjzx7zm6yqh', year: 'pri_01hsxyfysbzf90tkh2wqbfxwa5' },
    limit: '$99 / month',
    color: 'from-cyan-500 to-blue-500',
  },
];
