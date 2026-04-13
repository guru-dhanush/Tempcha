import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  description: string;
}

export function ExplainerPoint({ icon: Icon, label, description }: Props) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-[44px] h-[44px] rounded-lg bg-background/70 backdrop-blur-[6px] border border-border flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-[20px] h-[20px]" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[15px] leading-[22px] font-semibold mb-1">{label}</p>
        <p className="text-[14px] leading-[21px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
