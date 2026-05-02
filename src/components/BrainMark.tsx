"use client";

/**
 * BrainMark — MindBench 的品牌符号。
 *
 * 一个半圆形的神经网络节点图，左右脑两瓣，6 个节点 + 连接线 +
 * 沿着节点循环传导的「电脉冲」高亮。纯 SVG，不依赖任何运行时库。
 *
 * 在任何尺寸下都好看（16px favicon → 200px hero）。
 *
 * 颜色用 currentColor，方便外层用 className 控制（默认 brand-400 indigo）。
 */
export function BrainMark({
  size = 28,
  className = "",
  animated = true,
}: {
  size?: number;
  className?: string;
  /** 设为 false 关闭脉冲动画（在 favicon、og image 或 Reduced Motion 用户）*/
  animated?: boolean;
}) {
  // 6 个节点：左 3 + 右 3，呈对称弧形排布
  // 坐标系是 0..32（viewBox），24 是直径中心
  const nodes = [
    { x: 8,  y: 9,  delay: "0s"   },
    { x: 6,  y: 16, delay: "0.4s" },
    { x: 8,  y: 23, delay: "0.8s" },
    { x: 24, y: 9,  delay: "0.2s" },
    { x: 26, y: 16, delay: "0.6s" },
    { x: 24, y: 23, delay: "1.0s" },
  ];

  // 连接线（左半边、右半边、跨中线）
  const edges = [
    [0, 1], [1, 2], [0, 2],   // 左半
    [3, 4], [4, 5], [3, 5],   // 右半
    [0, 3], [1, 4], [2, 5],   // 跨中线（胼胝体）
  ] as const;

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="img"
    >
      {/* 外轮廓：左右脑两瓣 */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.55}
      >
        {/* 左半脑（半月） */}
        <path d="M 14 4 C 6 4, 3 11, 3 16 C 3 21, 6 28, 14 28" />
        {/* 右半脑 */}
        <path d="M 18 4 C 26 4, 29 11, 29 16 C 29 21, 26 28, 18 28" />
        {/* 中线 */}
        <line x1="16" y1="5" x2="16" y2="27" strokeDasharray="1.5 2" opacity={0.7} />
      </g>

      {/* 节点之间的连接 */}
      <g stroke="currentColor" strokeWidth={0.7} opacity={0.4}>
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
          />
        ))}
      </g>

      {/* 节点本身 */}
      <g fill="currentColor">
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={1.5}>
            {animated && (
              <>
                {/* 脉冲：半径放大 + 透明度衰减 */}
                <animate
                  attributeName="r"
                  values="1.5;2.6;1.5"
                  dur="1.8s"
                  begin={n.delay}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1;0.4;1"
                  dur="1.8s"
                  begin={n.delay}
                  repeatCount="indefinite"
                />
              </>
            )}
          </circle>
        ))}
      </g>
    </svg>
  );
}
