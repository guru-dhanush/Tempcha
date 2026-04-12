'use client';

import Link from 'next/link';
import { Zap, QrCode, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-8 relative flex flex-col items-center justify-center mt-20 mb-16 text-center overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb orb-purple w-[600px] h-[600px] -top-40 left-1/2 -translate-x-1/2 opacity-60 pointer-events-none" />
      <div className="orb orb-blue w-[400px] h-[400px] top-20 -left-20 opacity-40 pointer-events-none" />
      <div className="orb orb-cyan w-[300px] h-[300px] top-40 -right-10 opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Now available globally — no app required
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight">
          <span className="glow-text">Scan. Chat.</span>
          <br />
          <span className="text-foreground">Disappear.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          One permanent QR code. Infinite fresh conversations.
          FlashRoom gives businesses ephemeral group chat that vanishes when the session ends —{' '}
          <span className="text-foreground font-medium">no app, no signup, no data retained.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            asChild
            size="lg"
            className="flash-gradient text-white font-semibold px-8 py-6 text-base rounded-xl border-0 hover:opacity-90 transition-opacity"
          >
            <Link href="/signup">Start free — no credit card</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="glass border-white/10 text-foreground font-semibold px-8 py-6 text-base rounded-xl hover:bg-white/5 transition-colors"
          >
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>

        {/* Trust stats */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground mb-16">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Join in under 5 seconds
          </div>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-blue-400" />
            One QR, infinite sessions
          </div>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Zero data retained
          </div>
        </div>

        {/* Hero chat mockup */}
        <div className="relative mx-auto max-w-4xl">
          <div className="glass rounded-2xl p-1 shadow-2xl" style={{boxShadow: '0 0 60px hsl(258 100% 65% / 0.15), 0 0 120px hsl(258 100% 65% / 0.05)'}}>
            <div className="bg-card rounded-xl overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4 glass rounded-md px-3 py-1 text-xs text-muted-foreground text-left">
                  flashroom.io/r/sunset-table-4
                </div>
              </div>

              {/* Chat UI */}
              <div className="grid grid-cols-3 h-64 md:h-80">
                {/* Sidebar */}
                <div className="border-r border-border p-4 hidden md:block">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Room</div>
                  <div className="glass rounded-lg p-3 mb-2 border border-purple-500/20">
                    <div className="text-sm font-medium text-foreground mb-1">Table 4 — Dinner</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-muted-foreground">6 online · 2h 14m left</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    {[['T','Teal Falcon','purple'],['A','Amber Wolf','blue'],['S','Silver Fox','cyan']].map(([initial, name, color]) => (
                      <div key={name} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full bg-${color}-500/30 flex items-center justify-center text-${color}-300 text-xs font-bold`}>{initial}</div>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="col-span-3 md:col-span-2 p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">T</div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Teal Falcon</div>
                        <div className="glass rounded-xl rounded-tl-sm px-3 py-2 text-sm text-foreground max-w-xs">
                          Can we get some more bread please? 🍞
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">A</div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Amber Wolf</div>
                        <div className="glass rounded-xl rounded-tl-sm px-3 py-2 text-sm text-foreground max-w-xs">
                          The steak was amazing, compliments to the chef! ⭐
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start justify-end">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 text-right">Staff</div>
                        <div className="rounded-xl rounded-tr-sm px-3 py-2 text-sm text-white max-w-xs" style={{background:'hsl(258 80% 40% / 0.4)', border:'1px solid hsl(258 80% 60% / 0.2)'}}>
                          On its way! Thank you so much 🙏
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-purple-600/60 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">S</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 glass rounded-xl px-3 py-2">
                    <input className="flex-1 bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/50" placeholder="Message the room..." readOnly />
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg, hsl(258 100% 65%), hsl(220 100% 60%))'}}>
                      <Zap className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -right-4 -top-4 glass rounded-2xl p-4 hidden md:flex flex-col items-center gap-2" style={{border:'1px solid hsl(258 50% 60% / 0.2)', boxShadow:'0 0 30px hsl(258 100% 65% / 0.1)'}}>
            <QrCode className="w-12 h-12 text-purple-400" />
            <div className="text-xs text-center">
              <div className="font-semibold text-foreground">Scan to join</div>
              <div className="text-muted-foreground">No app needed</div>
            </div>
          </div>
          <div className="absolute -left-4 -bottom-4 glass rounded-2xl px-4 py-3 hidden md:flex items-center gap-3" style={{border:'1px solid hsl(258 50% 60% / 0.2)'}}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div className="text-xs">
              <div className="font-semibold text-foreground">Room active</div>
              <div className="text-muted-foreground">Expires in 1h 42m</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
