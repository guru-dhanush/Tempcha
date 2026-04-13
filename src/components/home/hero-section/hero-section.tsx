import Link from 'next/link';
import { Check, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Hero section — above the fold.
 * All font properties match the design system exactly:
 *   eyebrow  → text-[13px] leading-[20px] font-medium tracking-[0.1em] uppercase
 *   h1       → text-[48px] leading-[48px] md:text-[80px] md:leading-[80px] tracking-[-1.6px] font-medium
 *   body     → text-[18px] leading-[27px] md:text-[20px] md:leading-[30px]
 *   strip    → text-[14px] leading-[21px]  (matches badge sizing in pricing)
 *
 * SEO target keywords:
 *   temporary chat application, anonymous group chat, QR code chat room,
 *   no signup chat room, ephemeral messaging, temporary chat room for events
 */
export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-7xl px-[32px] relative flex items-center justify-between mt-16 mb-12"
    >
      <div className="text-center w-full">
        {/* Eyebrow — exact hero pattern */}
        <p className="text-[13px] leading-[20px] font-medium tracking-[0.1em] uppercase text-muted-foreground mb-6">
          The temporary chat application for businesses
        </p>

        {/* H1 — exact hero font */}
        <h1
          id="hero-heading"
          className="text-[48px] leading-[48px] md:text-[80px] md:leading-[80px] tracking-[-1.6px] font-medium"
        >
          Chat now.
          <br />
          Gone forever.
        </h1>

        {/* Body — exact hero body paragraph sizing */}
        <p className="mt-6 text-[18px] leading-[27px] md:text-[20px] md:leading-[30px] text-muted-foreground max-w-2xl mx-auto">
          Tempcha is a free temporary chat room you open with a QR code.
          No app. No account. Anonymous by default.
          Every message deletes itself when the session ends.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup" className="flex items-center gap-2">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <a href="#how-it-works" className="flex items-center gap-2">
              See how it works
              <ChevronDown className="w-4 h-4" />
            </a>
          </Button>
        </div>

        {/* Social proof strip — text-[14px] leading-[21px] matches badge sizing */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[14px] leading-[21px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" strokeWidth={2} />
            No credit card required
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" strokeWidth={2} />
            Works on any phone with a camera
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" strokeWidth={2} />
            Live in under 5 minutes
          </span>
        </div>
      </div>
    </section>
  );
}
