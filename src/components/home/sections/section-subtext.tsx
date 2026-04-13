interface Props {
  children: React.ReactNode;
}

/**
 * Body copy under section headings. Matches hero paragraph sizing.
 */
export function SectionSubtext({ children }: Props) {
  return (
    <p className="mt-5 text-[16px] leading-[26px] md:text-[18px] md:leading-[28px] text-muted-foreground max-w-2xl">
      {children}
    </p>
  );
}
