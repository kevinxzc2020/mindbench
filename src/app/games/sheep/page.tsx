"use client";

import Link from "next/link";
import { useRef } from "react";
import { useLang } from "@/lib/language-context";
import { Rabbit } from "lucide-react";

export default function SheepPage() {
  const { t } = useLang();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // iframe 加载完后自动滚到游戏中央。第三方 Vue bundle 大约 1-2s 才 ready，
  // 此时 onLoad 触发，把 iframe 容器 scroll 到顶部，保证整个 640px 游戏框在视野里。
  // 同时聚焦 iframe，让玩家点击 Start / Restart 时不需要先点一下 iframe 才能交互。
  const handleIframeLoad = () => {
    const el = iframeRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // contentWindow.focus() 让 iframe 拿到焦点（同源，安全）
    setTimeout(() => el.contentWindow?.focus(), 100);
  };

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
          <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white shadow">
            <Rabbit size={26} strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">{t.sheepTitle}</h1>
            <p className="text-sm text-gray-400">{t.sheepDesc}</p>
          </div>
        </div>

        {/* Game iframe */}
        <div
          className="rounded-2xl overflow-hidden border-2 border-pink-900/50 shadow-xl shadow-pink-900/20 bg-black"
          style={{ height: "640px" }}
          onClick={() => iframeRef.current?.contentWindow?.focus()}
        >
          <iframe
            ref={iframeRef}
            src="/sheep-game/index.html"
            className="w-full h-full block"
            style={{ border: "none" }}
            allow="fullscreen"
            title="兔了个兔"
            onLoad={handleIframeLoad}
          />
        </div>

        <p className="text-center text-xs text-gray-600">
          点击卡片拾取 · 凑齐 3 张同花色自动消除 · 格子满了 = 游戏结束
        </p>
      </div>
    </div>
  );
}
