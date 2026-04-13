import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  description: string;
}

/**
 * One point in the 3-column explainer strip.
 * Typography:
 *   label → text-[20px] leading-[30px] font-semibold
 *   description → text-[16px] leading-[24px]
 */
export function ExplainerPoint({ icon: Icon, label, description }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="w-[44px] h-[44px] rounded-lg bg-background/70 backdrop-blur-[6px] border border-border flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[20px] leading-[30px] font-semibold mb-2">{label}</p>
        <p className="text-[16px] leading-[24px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
