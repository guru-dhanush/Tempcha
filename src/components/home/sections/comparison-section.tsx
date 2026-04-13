'use client';

import { Check, X, Minus } from 'lucide-react';
import { SectionLabel } from '@/components/home/sections/section-label';
import { SectionHeading } from '@/components/home/sections/section-heading';
import { SectionSubtext } from '@/components/home/sections/section-subtext';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────

type Val = 'yes' | 'no' | 'partial' | string;

interface Competitor {
  name: string;
  tag: string;
  isUs?: boolean;
}

interface Feature {
  label: string;
  tooltip: string;
  values: Val[];
}

// ─── Competitors ──────────────────────────────────────────────────

const COLS: Competitor[] = [
  { name: 'Tempcha',            tag: 'QR-native business chat',    isUs: true  },
  { name: 'WhatsApp Business',  tag: 'Personal messaging'                      },
  { name: 'Telegram',           tag: 'Messaging platform'                      },
  { name: 'Discord',            tag: 'Community platform'                      },
  { name: 'Intercom',           tag: 'Customer support'                        },
  { name: 'Slack',              tag: 'Team collaboration'                      },
];

// ─── Feature rows ─────────────────────────────────────────────────

const ROWS: Feature[] = [
  {
    label:   'Scan QR — no app, no signup',
    tooltip: 'Participants scan a QR code and are instantly in the chat. No download, no account, no email.',
    values:  ['yes', 'no', 'no', 'no', 'no', 'no'],
  },
  {
    label:   'Works for complete strangers',
    tooltip: 'A venue can open a chat room for guests they have never met — no prior contact or number exchange needed.',
    values:  ['yes', 'no', 'no', 'partial', 'partial', 'no'],
  },
  {
    label:   'No phone number required',
    tooltip: 'Participants do not need to give any personal information to join.',
    values:  ['yes', 'no', 'no', 'partial', 'yes', 'partial'],
  },
  {
    label:   'Messages auto-delete on close',
    tooltip: 'When the session ends, every message is permanently erased from servers. Nothing is stored.',
    values:  ['yes', 'no', 'partial', 'no', 'no', 'no'],
  },
  {
    label:   'Admin controls retention',
    tooltip: 'The business decides: ephemeral, keep for 24 hours, 7 days, or permanently — per room.',
    values:  ['yes', 'no', 'no', 'no', 'no', 'no'],
  },
  {
    label:   'Group chat + private 1:1 together',
    tooltip: 'Same QR opens both a public group room and a private thread with staff — participant chooses.',
    values:  ['yes', 'partial', 'partial', 'partial', 'no', 'no'],
  },
  {
    label:   'Unified admin inbox',
    tooltip: 'All private threads from all participants visible in one dashboard — like WhatsApp Business meets Intercom.',
    values:  ['yes', 'partial', 'no', 'no', 'yes', 'no'],
  },
  {
    label:   'Permanent QR, fresh session every time',
    tooltip: 'Print the QR once. Every scan starts a brand new session — no reprinting, no new links.',
    values:  ['yes', 'no', 'no', 'no', 'no', 'no'],
  },
  {
    label:   'Built for physical venues',
    tooltip: 'Designed for restaurants, hotels, events, classrooms — spaces where guests arrive without an existing account.',
    values:  ['yes', 'partial', 'no', 'no', 'no', 'no'],
  },
  {
    label:   'Free tier available',
    tooltip: 'Start without a credit card.',
    values:  ['yes', 'yes', 'yes', 'yes', 'no', 'partial'],
  },
];

// ─── Cell renderer ─────────────────────────────────────────────────

function Cell({ val, isUs }: { val: Val; isUs?: boolean }) {
  if (val === 'yes') {
    return (
      <div className="flex justify-center">
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          isUs
            ? 'bg-foreground text-background'
            : 'bg-muted-foreground/20 text-muted-foreground',
        )}>
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
      </div>
    );
  }
  if (val === 'no') {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          <X className="w-3 h-3 text-muted-foreground/40" strokeWidth={2} />
        </div>
      </div>
    );
  }
  if (val === 'partial') {
    return (
      <div className="flex justify-center">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          <Minus className="w-3 h-3 text-muted-foreground/60" strokeWidth={2} />
        </div>
      </div>
    );
  }
  return <span className="text-[14px] leading-[21px] text-muted-foreground text-center block">{val}</span>;
}

// ─── Component ─────────────────────────────────────────────────────

export function ComparisonSection() {
  return (
    <section
      aria-labelledby="comparison-heading"
      className="mx-auto max-w-7xl px-[32px] py-16 md:py-24"
    >
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <SectionLabel>How we compare</SectionLabel>
        <SectionHeading>
          <h2 id="comparison-heading">
            Built for something none of them do
          </h2>
        </SectionHeading>
        <div className="flex justify-center">
          <SectionSubtext>
            WhatsApp, Telegram, Discord, Intercom — great tools. But none of them let a
            complete stranger scan a QR code, chat anonymously, and leave no trace.
            That is what Tempcha does.
          </SectionSubtext>
        </div>
      </div>

      {/* Table wrapper — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-[32px] px-[32px]">
        <div className="min-w-[700px]">

          {/* Column headers */}
          <div className="grid gap-0 mb-2" style={{ gridTemplateColumns: '2fr repeat(6, 1fr)' }}>
            {/* Empty label column */}
            <div />
            {COLS.map((col) => (
              <div
                key={col.name}
                className={cn(
                  'px-2 pb-4 text-center',
                  col.isUs && 'relative',
                )}
              >
                {col.isUs && (
                  <div className="absolute inset-x-1 top-0 bottom-0 rounded-t-lg bg-background/70 backdrop-blur-[6px] pricing-card-border -z-10" />
                )}
                <p className={cn(
                  'text-[14px] leading-[21px] font-semibold',
                  col.isUs ? 'text-foreground' : 'text-muted-foreground',
                )}>
                  {col.name}
                </p>
                <p className="text-[12px] leading-[18px] text-muted-foreground/60 mt-0.5">
                  {col.tag}
                </p>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {ROWS.map((row, ri) => (
            <div
              key={row.label}
              className={cn(
                'grid gap-0 items-center',
                ri < ROWS.length - 1 ? 'border-b border-border' : '',
              )}
              style={{ gridTemplateColumns: '2fr repeat(6, 1fr)' }}
            >
              {/* Feature label */}
              <div className="py-4 pr-4">
                <p className="text-[14px] leading-[21px] font-medium">{row.label}</p>
                <p className="text-[12px] leading-[18px] text-muted-foreground mt-0.5">
                  {row.tooltip}
                </p>
              </div>

              {/* Values */}
              {COLS.map((col, ci) => (
                <div
                  key={col.name}
                  className={cn(
                    'py-4 px-2',
                    col.isUs && 'relative bg-background/30',
                    col.isUs && ri === ROWS.length - 1 && 'rounded-b-lg',
                  )}
                >
                  <Cell val={row.values[ci]} isUs={col.isUs} />
                </div>
              ))}
            </div>
          ))}

        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-[12px] leading-[18px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
            <Check className="w-3 h-3 text-background" strokeWidth={2.5} />
          </div>
          Yes — fully supported
        </span>
        <span className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <Minus className="w-2.5 h-2.5 text-muted-foreground" strokeWidth={2} />
          </div>
          Partial — limited or workaround needed
        </span>
        <span className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <X className="w-2.5 h-2.5 text-muted-foreground/40" strokeWidth={2} />
          </div>
          No — not supported
        </span>
      </div>
    </section>
  );
}
