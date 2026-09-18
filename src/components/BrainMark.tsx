"use client";

/**
 * MindBench temporary brand mark.
 *
 * This is intentionally an abstract neural-orbit emblem rather than a literal
 * brain outline. It is the no-cost placeholder until the ImageGen logo can be
 * generated after the account image allowance resets.
 */
export function BrainMark({
  size = 28,
  className = "",
  animated = true,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="mb-orbit-gradient" x1="4" y1="35" x2="36" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1c45fb" />
          <stop offset="0.58" stopColor="#1cb1fb" />
          <stop offset="1" stopColor="#04ede3" />
        </linearGradient>
        <radialGradient id="mb-core-gradient" cx="35%" cy="28%" r="78%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.18" stopColor="#04ede3" />
          <stop offset="0.58" stopColor="#1cb1fb" />
          <stop offset="1" stopColor="#1c45fb" />
        </radialGradient>
        <filter id="mb-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="20" cy="20" r="17" fill="none" stroke="url(#mb-orbit-gradient)" strokeWidth="0.7" opacity="0.22" />
      <ellipse cx="20" cy="20" rx="15.5" ry="7.1" fill="none" stroke="url(#mb-orbit-gradient)" strokeWidth="1.15" opacity="0.72" transform="rotate(-28 20 20)" />
      <ellipse cx="20" cy="20" rx="15.5" ry="7.1" fill="none" stroke="url(#mb-orbit-gradient)" strokeWidth="1.05" opacity="0.48" transform="rotate(32 20 20)" />

      <path
        d="M10.1 12.8C14.8 9.1 17.5 8.5 20 11.7c2.5-3.2 5.2-2.6 9.9 1.1M10.1 27.2c4.7 3.7 7.4 4.3 9.9 1.1 2.5 3.2 5.2 2.6 9.9-1.1"
        fill="none"
        stroke="url(#mb-orbit-gradient)"
        strokeWidth="1.45"
        strokeLinecap="round"
        opacity="0.92"
      />

      <path
        d="M20 11.2 25.2 14v7.4L20 24.5l-5.2-3.1V14L20 11.2Z"
        fill="url(#mb-core-gradient)"
        filter="url(#mb-glow)"
      />
      <path d="m20 11.2 5.2 2.8L20 17.1 14.8 14l5.2-2.8Z" fill="#ffffff" opacity="0.45" />
      <path d="M20 17.1v7.4l5.2-3.1V14L20 17.1Z" fill="#1c45fb" opacity="0.38" />
      <path d="M20 17.1v7.4l-5.2-3.1V14L20 17.1Z" fill="#04ede3" opacity="0.34" />

      <g fill="#04ede3" filter="url(#mb-glow)">
        <circle cx="9.1" cy="13.1" r="1.05" />
        <circle cx="30.9" cy="26.9" r="1.05" />
      </g>
      <g fill="#1cb1fb">
        <circle cx="9.1" cy="26.9" r="0.75" opacity="0.85" />
        <circle cx="30.9" cy="13.1" r="0.75" opacity="0.85" />
      </g>

      {animated && (
        <circle cx="20" cy="20" r="5.2" fill="none" stroke="#04ede3" strokeWidth="0.65" opacity="0.65">
          <animate attributeName="r" values="4.4;6.4;4.4" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0.8;0.25" dur="2.8s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}
