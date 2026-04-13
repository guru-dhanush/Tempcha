interface Props {
  children: React.ReactNode;
  className?: string;
}

/**
 * Consistent h2 for all landing sections.
 * Mirrors hero h1 scale — medium weight, tight tracking.
 */
export function SectionHeading({ children, className = '' }: Props) {
  return (
    <h2
      className={`text-[36px] leading-[40px] md:text-[52px] md:leading-[56px] tracking-[-1px] font-medium ${className}`}
    >
      {children}
    </h2>
  );
}
