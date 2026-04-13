interface Props {
  number: string;
  title: string;
  description: string;
}

export function StepCard({ number, title, description }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="w-[44px] h-[44px] rounded-full border border-border bg-background/70 backdrop-blur-[6px] flex items-center justify-center text-[16px] font-semibold text-foreground shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-[16px] leading-[24px] font-semibold mb-2">{title}</h3>
        <p className="text-[14px] leading-[22px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
