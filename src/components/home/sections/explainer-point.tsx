interface Props {
  icon: string;
  label: string;
  description: string;
}

/**
 * One point in the 3-point explainer strip.
 * Horizontal layout: icon | label + description.
 */
export function ExplainerPoint({ icon, label, description }: Props) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-[44px] h-[44px] rounded-lg bg-background/70 backdrop-blur-[6px] border border-border flex items-center justify-center text-[20px] shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-[15px] leading-[22px] font-semibold mb-1">{label}</p>
        <p className="text-[14px] leading-[21px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
