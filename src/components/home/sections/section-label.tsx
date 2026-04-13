interface Props {
  children: React.ReactNode;
}

/**
 * Eyebrow label above section headings.
 * Matches the hero eyebrow: text-[13px] leading-[20px] font-medium tracking-[0.1em] uppercase
 */
export function SectionLabel({ children }: Props) {
  return (
    <p className="text-[13px] leading-[20px] font-medium tracking-[0.1em] uppercase text-muted-foreground mb-4">
      {children}
    </p>
  );
}
