/**
 * UserAvatar — 用 hash(userId) 决定两个色相 → 线性渐变背景 + 首两个字符。
 *
 * 替换之前 leaderboard 用的国旗 emoji。优点：
 *   - 每个 userId 永远是同一个颜色（hash 稳定）
 *   - 跨平台 100% 一致渲染（不会出现 Windows 字体盒子）
 *   - 中文名也能正常显示首字符
 */

// FNV-ish 32 位 hash
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 取 userId hash 决定两个色相，组成两色 linear-gradient */
function gradientFor(userId: string): string {
  const h = hash32(userId);
  const hue1 = h % 360;
  const hue2 = (hue1 + 60 + (h % 80)) % 360; // 偏移 60~140 度，避免单色
  const sat = 60 + (h % 25); // 60~85%
  const light = 45 + ((h >> 5) % 15); // 45~60%
  return `linear-gradient(135deg, hsl(${hue1} ${sat}% ${light}%), hsl(${hue2} ${sat}% ${Math.max(30, light - 12)}%))`;
}

/** 取名字前 1~2 个字符（汉字 1 个，拉丁字母 2 个）*/
function initialsFor(name: string): string {
  if (!name) return "·";
  const trimmed = name.trim();
  if (trimmed.length === 0) return "·";
  const first = trimmed[0];
  // CJK 字符（中日韩统一表意）— 取一个就够了
  if (/[一-鿿぀-ヿ가-힯]/.test(first)) {
    return first;
  }
  // 拉丁名取首字母 +（如果有）次字母大写
  const letters = trimmed.replace(/[^a-zA-Z]/g, "");
  if (letters.length === 0) return first.toUpperCase();
  return letters.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  userId,
  name,
  size = 36,
  className = "",
}: {
  userId: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = initialsFor(name);
  const isCJK = initials.length === 1 && /[一-鿿぀-ヿ가-힯]/.test(initials);
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shadow-inner ${className}`}
      style={{
        width: size,
        height: size,
        background: gradientFor(userId),
        fontSize: isCJK ? size * 0.5 : size * 0.38,
        letterSpacing: isCJK ? 0 : "-0.02em",
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
