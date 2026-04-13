interface Props {
  children: React.ReactNode;
}

/**
 * Small uppercase eyebrow label above section headings.
 * Matches design system — uses muted-foreground, existing text sizing.
 */
export function SectionLabel({ children }: Props) {
  return (
    <p className="text-[13px] leading-[20px] font-medium tracking-[0.1em] uppercase text-muted-foreground mb-4">
      {children}
    </p>
  );
}
