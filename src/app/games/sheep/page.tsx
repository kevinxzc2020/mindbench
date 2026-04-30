"use client";

import Link from "next/link";
import { useLang } from "@/lib/language-context";

export default function SheepPage() {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Back nav */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← {t.home}
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-8 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="text-4xl">🐰</span>
          <div>
            <h1 className="text-2xl font-bold text-white">{t.sheepTitle}</h1>
            <p className="text-sm text-gray-400">{t.sheepDesc}</p>
          </div>
        </div>

        {/* Game iframe */}
        <div className="rounded-2xl overflow-hidden border-2 border-pink-900/50 shadow-xl shadow-pink-900/20 bg-black"
             style={{ height: "640px" }}>
          <iframe
            src="/sheep-game/index.html"
            className="w-full h-full block"
            style={{ border: "none" }}
            allow="fullscreen"
            title="兔了个兔"
          />
        </div>

        <p className="text-center text-xs text-gray-600">
          点击卡片拾取 · 凑齐 3 张同花色自动消除 · 格子满了 = 游戏结束
        </p>
      </div>
    </div>
  );
}
