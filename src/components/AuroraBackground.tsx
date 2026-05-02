"use client";

/**
 * AuroraBackground — 全屏星云背景。
 *
 * 三个超大模糊光斑（紫 / 蓝 / 粉）在视口里慢漂，配合极低饱和的网格 mask
 * 模拟"会呼吸"的暗色背景。纯 CSS 动画，不影响性能。
 *
 * 用法：在 layout.tsx 的 body 里固定定位（z-index: -10），所有页面共用。
 *
 * 尊重 prefers-reduced-motion —— 那些用户看到的是静止版本。
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* 底色，不是纯黑 —— 偏蓝紫的"夜空" */}
      <div className="absolute inset-0 bg-[#070914]" />

      {/* 三团光雾 */}
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />

      {/* 微噪 + vignette 让纯色不空 */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
    </div>
  );
}
