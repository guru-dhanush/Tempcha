import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: Props) {
  return (
    <div className="rounded-lg bg-background/70 backdrop-blur-[6px] overflow-hidden pricing-card-border p-6 flex flex-col gap-4">
      <div className="w-[40px] h-[40px] rounded-lg border border-border flex items-center justify-center">
        <Icon className="w-[20px] h-[20px] text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-[16px] leading-[24px] font-semibold mb-2">{title}</h3>
        <p className="text-[14px] leading-[22px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
