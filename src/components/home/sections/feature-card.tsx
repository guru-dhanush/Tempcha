interface Props {
  icon: string;
  title: string;
  description: string;
}

/**
 * Card used in "Who is this for" section.
 * Uses same card style as pricing cards: bg-background/70, backdrop-blur, pricing-card-border.
 */
export function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="rounded-lg bg-background/70 backdrop-blur-[6px] overflow-hidden pricing-card-border p-6 flex flex-col gap-4">
      <div className="text-[28px] leading-none">{icon}</div>
      <div>
        <h3 className="text-[16px] leading-[24px] font-semibold mb-2">{title}</h3>
        <p className="text-[14px] leading-[22px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
