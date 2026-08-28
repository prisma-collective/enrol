interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export default function SectionHeading({
  children,
  className = "",
  as: Tag = "h2",
}: SectionHeadingProps) {
  return (
    <Tag
      className={`font-display text-4xl sm:text-5xl tracking-[0.04em] text-signal uppercase ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
