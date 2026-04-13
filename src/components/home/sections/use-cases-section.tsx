import {
  UtensilsCrossed,
  Mic2,
  GraduationCap,
  Hotel,
  Stethoscope,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { FeatureCard } from '@/components/home/sections/feature-card';
import { SectionLabel } from '@/components/home/sections/section-label';
import { SectionHeading } from '@/components/home/sections/section-heading';
import { SectionSubtext } from '@/components/home/sections/section-subtext';

interface UseCase {
  icon: LucideIcon;
  title: string;
  description: string;
}

const USE_CASES: UseCase[] = [
  {
    icon: UtensilsCrossed,
    title: 'Restaurants & Cafes',
    description:
      'Put a QR on every table. Guests send requests, feedback, or questions without flagging down a server. Everything clears when they leave.',
  },
  {
    icon: Mic2,
    title: 'Events & Conferences',
    description:
      'Display a QR on the main screen. Attendees ask questions, vote, or react anonymously in real time — no raise of hands needed.',
  },
  {
    icon: GraduationCap,
    title: 'Classrooms & Training',
    description:
      "Students ask questions they'd never ask aloud. Trainers get honest feedback. Every session starts fresh with no history from last week.",
  },
  {
    icon: Hotel,
    title: 'Hotels & Hospitality',
    description:
      'A QR in every room connects guests to reception instantly. Resets on checkout — the next guest always starts a clean conversation.',
  },
  {
    icon: Stethoscope,
    title: 'Clinics & Waiting Rooms',
    description:
      'Patients ask questions privately without coming to the desk. No personal data collected. No records of who asked what.',
  },
  {
    icon: Building2,
    title: 'Offices & Meeting Rooms',
    description:
      'A QR on the wall spins up a chat for whoever is in the room. Ends when the meeting ends. No leftover Slack channels to archive.',
  },
];

export function UseCasesSection() {
  return (
    <section
      aria-labelledby="use-cases-heading"
      className="mx-auto max-w-7xl px-[32px] py-16 md:py-24"
    >
      <div className="text-center mb-12 md:mb-16">
        <SectionLabel>Who is Tempcha for?</SectionLabel>
        <SectionHeading>
          <h2 id="use-cases-heading">Any place people need to talk — fast</h2>
        </SectionHeading>
        <div className="flex justify-center">
          <SectionSubtext>
            Tempcha is a temporary chat application for physical spaces. Wherever people gather,
            one QR code is all you need to start a real-time group conversation.
          </SectionSubtext>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {USE_CASES.map((item) => (
          <FeatureCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </section>
  );
}
