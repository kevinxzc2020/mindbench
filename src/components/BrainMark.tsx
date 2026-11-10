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
      src="/brand/mindbench-laboratory-logo.png"
      width={2172}
      height={724}
      sizes={`${size * 4}px`}
      className={className}
      alt="MindBench"
      style={{ width: size * 4, height: size, objectFit: "cover", objectPosition: "center", flexShrink: 0 }}
    />
  );
}
