import { type LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Trust badge.
 * Typography:
 *   title → text-[20px] leading-[30px] font-semibold
 *   description → text-[16px] leading-[24px]
 */
export function TrustPillar({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center text-center gap-5 px-6">
      <div className="w-[56px] h-[56px] rounded-lg bg-background/70 backdrop-blur-[6px] border border-border flex items-center justify-center">
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[20px] leading-[30px] font-semibold mb-2">{title}</p>
        <p className="text-[16px] leading-[24px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
