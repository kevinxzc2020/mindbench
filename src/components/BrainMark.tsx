import Image from "next/image";

/** Shared generated brand asset; keeps the existing component API. */
export function BrainMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <Image
      src="/brand/mindbench-logo.png"
      width={size}
      height={size}
      sizes={`${size}px`}
      className={className}
      alt=""
      aria-hidden="true"
      style={{ objectFit: "contain", flexShrink: 0 }}
    />
  );
}
