import Image from "next/image";

type BrandMarkProps = { className?: string; label?: string };

/** Reuse the user's final PNG at every brand surface without drawing a substitute mark. */
export function BrandMark({ className = "", label }: BrandMarkProps) {
  return (
    <Image
      className={["brand-mark", className].filter(Boolean).join(" ")}
      src="/brand/katalyst.png"
      width={512}
      height={512}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      loading="eager"
      unoptimized
    />
  );
}
