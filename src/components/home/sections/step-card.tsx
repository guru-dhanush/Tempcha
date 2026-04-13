interface Props {
  number: string;
  title: string;
  description: string;
}

/**
 * Numbered step card.
 * Typography:
 *   title → text-[20px] leading-[30px] font-semibold  (= plan name)
 *   description → text-[16px] leading-[24px]           (= tier.description)
 */
export function StepCard({ number, title, description }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="w-[44px] h-[44px] rounded-full border border-border bg-background/70 backdrop-blur-[6px] flex items-center justify-center text-[16px] leading-[24px] font-semibold shrink-0">
        {number}
      </div>
      <div>
        <p className="text-[20px] leading-[30px] font-semibold mb-2">{title}</p>
        <p className="text-[16px] leading-[24px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
