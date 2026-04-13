import { StepCard } from '@/components/home/sections/step-card';
import { SectionLabel } from '@/components/home/sections/section-label';
import { SectionHeading } from '@/components/home/sections/section-heading';
import { SectionSubtext } from '@/components/home/sections/section-subtext';

const STEPS = [
  {
    number: '1',
    title: 'Create a room in your dashboard',
    description: 'Give it a name, set how long sessions last, and pick a colour. You get a permanent QR code that you only ever have to set up once.',
  },
  {
    number: '2',
    title: 'Print or display your QR code',
    description: 'Put it on a table tent, a presentation slide, a poster, or a TV screen. One scan is all anyone needs — no link to copy, no password to share.',
  },
  {
    number: '3',
    title: 'Open a session when you\'re ready',
    description: 'Hit "Go live" in your dashboard. The room is now active. Anyone who scans the QR joins instantly with an anonymous nickname — no app, no signup.',
  },
  {
    number: '4',
    title: 'Chat in real time',
    description: 'Everyone in the room can send messages, react with emoji, and see who\'s typing. You can reply as Staff from your dashboard.',
  },
  {
    number: '5',
    title: 'Close the session — everything disappears',
    description: 'When you\'re done, close the session. Every message is permanently deleted from our servers. The QR resets for next time.',
  },
] as const;

/**
 * How it works — numbered steps.
 * SEO: how to set up temporary chat room, anonymous chat no signup, QR code group chat
 */
export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mx-auto max-w-7xl px-[32px] py-16 md:py-24"
    >
      <div className="text-center mb-12 md:mb-16">
        <SectionLabel>Simple from day one</SectionLabel>
        <SectionHeading>
          <h2 id="how-it-works-heading">
            Set up in under five minutes
          </h2>
        </SectionHeading>
        <div className="flex justify-center">
          <SectionSubtext>
            No developer needed. No IT department. If you can print a piece of paper, you can run Tempcha.
          </SectionSubtext>
        </div>
      </div>

      {/* Steps — two-column on desktop, single on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Left column: steps 1-3 */}
        <div className="flex flex-col">
          {STEPS.slice(0, 3).map((step, i) => (
            <div
              key={step.number}
              className="flex gap-8 px-8 py-8 border-b border-border last:border-b-0 md:border-r md:last:border-b"
            >
              <StepCard
                number={step.number}
                title={step.title}
                description={step.description}
              />
            </div>
          ))}
        </div>
        {/* Right column: steps 4-5 + visual */}
        <div className="flex flex-col">
          {STEPS.slice(3).map((step) => (
            <div
              key={step.number}
              className="flex gap-8 px-8 py-8 border-b border-border last:border-b-0"
            >
              <StepCard
                number={step.number}
                title={step.title}
                description={step.description}
              />
            </div>
          ))}
          {/* Decorative — matches card style, fills remaining vertical space */}
          <div className="flex-1 px-8 py-8 flex items-center justify-center">
            <div className="rounded-lg bg-background/70 backdrop-blur-[6px] border border-border p-6 w-full max-w-[280px] text-center">
              <div className="text-[40px] mb-4">⬡</div>
              <p className="text-[14px] leading-[22px] font-semibold mb-1">Your QR code is permanent</p>
              <p className="text-[13px] leading-[20px] text-muted-foreground">
                Print it once. Every scan opens a brand new temporary chat room.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
