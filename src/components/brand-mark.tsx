type BrandMarkProps = { className?: string; label?: string };

export function BrandMark({ className = "", label }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 29V7h6v9L22 7h9L17 18l14 11h-9L11 20v9H5Z" fill="var(--signal)" />
      <path d="M5 29h6v-9l8 6v3h-8v0H5Z" fill="currentColor" opacity=".72" />
    </svg>
  );
}
