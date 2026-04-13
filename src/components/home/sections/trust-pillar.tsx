interface Props {
  icon: string;
  title: string;
  description: string;
}

/**
 * Trust badge used in the privacy section.
 * Minimal — icon, bold title, short line. No card chrome.
 */
export function TrustPillar({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center text-center gap-4 px-6">
      <div className="w-[56px] h-[56px] rounded-lg bg-background/70 backdrop-blur-[6px] border border-border flex items-center justify-center text-[24px]">
        {icon}
      </div>
      <div>
        <h3 className="text-[16px] leading-[24px] font-semibold mb-1">{title}</h3>
        <p className="text-[14px] leading-[22px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
