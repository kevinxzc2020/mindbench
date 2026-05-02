"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";

/**
 * MagneticCard — 鼠标悬浮时跟着鼠标轻微 3D 倾斜的卡片包装。
 *
 * 没用任何 lib —— 直接读 mousemove 算 rotateX/Y。离开时回正。
 * `--mx` / `--my` 透出给子元素，让"光斑跟着鼠标"这种效果可以在内部实现。
 *
 * Reduced Motion 下完全禁用倾斜（直接渲染 Link，没有事件监听）。
 */
export function MagneticCard({
  href,
  className = "",
  children,
  glow = true,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  /** 是否启用鼠标位置的内部光晕（光跟着鼠标走）*/
  glow?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  function onMove(e: MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    // 最大倾斜 6 度，根据距中心比例
    const rx = ((y - cy) / cy) * -5;
    const ry = ((x - cx) / cx) * 5;
    el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    if (glow) {
      el.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
      el.style.setProperty("--my", `${(y / rect.height) * 100}%`);
    }
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <Link
      href={href}
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`magnetic-card ${className}`}
      style={{
        // CSS variable 默认值，避免初始 NaN
        // @ts-expect-error CSS custom prop
        "--rx": "0deg",
        "--ry": "0deg",
        "--mx": "50%",
        "--my": "50%",
      }}
    >
      {children}
    </Link>
  );
}
