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
      <defs>
        <linearGradient id="kat-emblem-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-primary, #2563eb)" />
          <stop offset="100%" stopColor="var(--accent-hover, #1d4ed8)" />
        </linearGradient>
      </defs>
      {/* Isometric Pillar / UNIX stem */}
      <rect x="4.5" y="4" width="5" height="24" rx="1.5" fill="currentColor" />
      {/* Upper compiler chevron facet */}
      <path d="M13.5 13.5 L23.5 3.5 H28.5 L17 15 Z" fill="url(#kat-emblem-accent)" />
      {/* Lower compiler chevron facet */}
      <path d="M17 17 L28.5 28.5 H23.5 L13.5 18.5 Z" fill="url(#kat-emblem-accent)" />
      {/* Circuit bridge trace connecting stem to compiler nexus */}
      <path d="M9.5 16 H14" stroke="var(--accent-primary, #2563eb)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Precision circuit node at nexus */}
      <circle cx="15.2" cy="16" r="2.2" fill="var(--accent-primary, #2563eb)" />
      <circle cx="15.2" cy="16" r="1.1" fill="var(--bg-surface, #ffffff)" />
      {/* Sub-circuit terminal micro-nodes */}
      <circle cx="7" cy="5" r="1.3" fill="var(--accent-primary, #2563eb)" />
      <circle cx="7" cy="27" r="1.3" fill="var(--accent-primary, #2563eb)" />
    </svg>
  );
}
