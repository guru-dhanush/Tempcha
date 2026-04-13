import { UserX, ServerCrash, ShieldOff } from 'lucide-react';
import { TrustPillar } from '@/components/home/sections/trust-pillar';
import { SectionLabel } from '@/components/home/sections/section-label';
import { SectionHeading } from '@/components/home/sections/section-heading';
import { SectionSubtext } from '@/components/home/sections/section-subtext';
import { type LucideIcon } from 'lucide-react';

interface Pillar {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PILLARS: Pillar[] = [
  {
    icon: UserX,
    title: 'No account needed',
    description:
      'Participants never create an account, enter an email, or download an app. Scan and chat in under five seconds.',
  },
  {
    icon: ServerCrash,
    title: 'No permanent storage',
    description:
      'Messages live only in memory during the session. When you close the room, they are deleted from our servers forever — not archived, not anonymised. Gone.',
  },
  {
    icon: ShieldOff,
    title: 'No tracking',
    description:
      'We do not track participants across sessions. We do not sell data. We do not build profiles. A chat room is a conversation, not a database.',
  },
];

export function TrustSection() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="mx-auto max-w-7xl px-[32px] py-16 md:py-24"
    >
      <div className="text-center mb-12 md:mb-16">
        <SectionLabel>Built on privacy</SectionLabel>
        <SectionHeading>
          <h2 id="trust-heading">Nothing is stored. Not even a little.</h2>
        </SectionHeading>
        <div className="flex justify-center">
          <SectionSubtext>
            Most temporary chat applications say they delete messages. Tempcha is built so that it
            is architecturally impossible to retrieve them — because they are never written to disk
            in the first place.
          </SectionSubtext>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
        {PILLARS.map((pillar) => (
          <TrustPillar
            key={pillar.title}
            icon={pillar.icon}
            title={pillar.title}
            description={pillar.description}
          />
        ))}
      </div>
    </section>
  );
}
