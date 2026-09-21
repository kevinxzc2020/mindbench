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
      src="/brand/mindbench-wordmark-v2.png"
      width={size * 4}
      height={size}
      sizes={`${size * 4}px`}
      className={className}
      alt="MindBench"
      style={{ objectFit: "contain", flexShrink: 0 }}
    />
  );
}
