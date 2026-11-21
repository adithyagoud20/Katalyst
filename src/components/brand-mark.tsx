type BrandMarkProps = { className?: string; label?: string };

/** Reuse the user's final PNG at every brand surface without drawing a substitute mark. */
export function BrandMark({ className = "", label }: BrandMarkProps) {
  return <span role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={["brand-mark", className].filter(Boolean).join(" ")} />;
}
