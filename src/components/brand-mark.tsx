type BrandMarkProps = { className?: string; label?: string };

export function BrandMark({ className = "", label }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Precision terminal stem (UNIX pipe / cursor) */}
      <rect x="4" y="4" width="5.5" height="24" rx="1.5" fill="currentColor" />
      {/* Precision compiler prompt chevron (upper diagonal) */}
      <path d="M14 13.5 L23.5 4 H28.5 L17.5 15 Z" fill="var(--signal)" />
      {/* Precision compiler prompt chevron (lower diagonal) */}
      <path d="M17.5 17 L28.5 28 H23.5 L14 18.5 Z" fill="var(--signal)" />
    </svg>
  );
}
