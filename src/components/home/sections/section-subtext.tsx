interface Props {
  children: React.ReactNode;
}

/**
 * Body copy under section headings.
 * Exact match to hero paragraph: text-[18px] leading-[27px] md:text-[20px] md:leading-[30px]
 * No font-weight — inherits normal, matching the design system convention.
 */
export function SectionSubtext({ children }: Props) {
  return (
    <p className="mt-6 text-[18px] leading-[27px] md:text-[20px] md:leading-[30px] text-muted-foreground max-w-2xl">
      {children}
    </p>
  );
}
