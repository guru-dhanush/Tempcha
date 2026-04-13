import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Card for "Who is this for" section.
 * Typography matches pricing cards:
 *   title → text-[20px] leading-[30px] font-semibold  (= plan name)
 *   description → text-[16px] leading-[24px]           (= tier.description)
 */
export function FeatureCard({ icon: Icon, title, description }: Props) {
  return (
    <div className="rounded-lg bg-background/70 backdrop-blur-[6px] overflow-hidden pricing-card-border p-8 flex flex-col gap-5">
      <div className="w-[40px] h-[40px] rounded-lg border border-border flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[20px] leading-[30px] font-semibold mb-2">{title}</p>
        <p className="text-[16px] leading-[24px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
