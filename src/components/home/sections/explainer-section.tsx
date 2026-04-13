import { QrCode, Zap, Trash2 } from 'lucide-react';
import { ExplainerPoint } from '@/components/home/sections/explainer-point';

export function ExplainerSection() {
  return (
    <section
      aria-labelledby="explainer-heading"
      className="mx-auto max-w-7xl px-[32px] py-16 md:py-20"
    >
      <div className="rounded-lg bg-background/70 backdrop-blur-[6px] overflow-hidden pricing-card-border">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-8">
            <ExplainerPoint
              icon={QrCode}
              label="One permanent QR code"
              description="Print it on a menu, a poster, or a table card. It never changes. Scan it any time to start a fresh chat room — no reprinting, ever."
            />
          </div>
          <div className="p-8">
            <ExplainerPoint
              icon={Zap}
              label="Anyone joins in seconds"
              description="No app to download. No account to create. Just scan and type. Works on every phone with a camera — iPhone, Android, anything."
            />
          </div>
          <div className="p-8">
            <ExplainerPoint
              icon={Trash2}
              label="Everything deletes itself"
              description="When you close the session, every message is permanently deleted from our servers. Nothing is stored. Nothing can be leaked."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
