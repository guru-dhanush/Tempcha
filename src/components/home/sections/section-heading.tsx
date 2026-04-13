interface Props {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Section h2. Mirrors hero h1: font-medium, tracking-[-1.6px].
 * The design system uses font-medium (NOT bold) for display headings.
 */
export function SectionHeading({ children, className = '', id }: Props) {
  return (
    <h2
      id={id}
      className={`text-[36px] leading-[40px] md:text-[56px] md:leading-[60px] tracking-[-1.6px] font-medium ${className}`}
    >
      {children}
    </h2>
  );
}
