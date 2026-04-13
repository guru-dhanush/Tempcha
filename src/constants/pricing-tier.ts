export interface Tier {
  name: string;
  id: 'starter' | 'pro' | 'advanced';
  icon: string;
  description: string;
  features: string[];
  featured: boolean;
  priceId: Record<string, string>;
}

export const PricingTier: Tier[] = [
  {
    name: 'Free',
    id: 'starter',
    icon: '/assets/icons/price-tiers/free-icon.svg',
    description: 'Perfect for trying Tempcha. No credit card required.',
    features: [
      '1 permanent QR room',
      'Up to 20 participants per session',
      '2-hour max session length',
      'Anonymous aliases',
      'Real-time group chat',
      'Emoji reactions',
      'Tempcha branding',
    ],
    featured: false,
    priceId: {
      month: 'pri_01hsxyh9txq4rzbrhbyngkhy46',
      year: 'pri_01hsxyh9txq4rzbrhbyngkhy46',
    },
  },
  {
    name: 'Business',
    id: 'pro',
    icon: '/assets/icons/price-tiers/basic-icon.svg',
    description: 'For venues and businesses that run sessions regularly.',
    features: [
      '5 permanent QR rooms',
      'Up to 100 participants per session',
      '12-hour session length',
      'Custom welcome message',
      'Auto-schedule sessions',
      'Session analytics',
      'Staff reply mode',
      'Priority support',
    ],
    featured: true,
    priceId: {
      month: 'pri_01hsxycme6m95sejkz7sbz5e9g',
      year: 'pri_01hsxyeb2bmrg618bzwcwvdd6q',
    },
  },
  {
    name: 'Enterprise',
    id: 'advanced',
    icon: '/assets/icons/price-tiers/pro-icon.svg',
    description: 'Unlimited rooms for hotel chains, institutions and large venues.',
    features: [
      'Unlimited QR rooms',
      'Up to 500 participants per session',
      'Unlimited session length',
      'Custom branding and logo',
      'Full analytics and CSV export',
      'Participant moderation and kick',
      'Pin staff announcements',
      'API access',
    ],
    featured: false,
    priceId: {
      month: 'pri_01hsxyff091kyc9rjzx7zm6yqh',
      year: 'pri_01hsxyfysbzf90tkh2wqbfxwa5',
    },
  },
];
