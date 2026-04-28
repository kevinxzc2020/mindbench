"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { TarotShuffleStage } from "./TarotShuffleStage";
import { cn } from "@/lib/utils";

type Phase = "intro" | "shuffle";

const CARD_BACK_PATH = "/resources/card/card.png";
const CARD_BACK_MASK_PATH = "/resources/card/cardmask.png";

/** 黑底蒙版：按亮度遮罩（亮线可见、黑底隐藏），勿用默认 alpha 整张不透明矩形 */
const MASK_LUMINANCE = {
  WebkitMaskMode: "luminance" as const,
  maskMode: "luminance" as const,
};

/** 卡背 hover：screen 叠加以暖金为主，避免中心发白（仅 intro 牌堆；spread 与菜单 pill 一致用紫色） */
const CARD_BACK_SCREEN_GLOW =
  "radial-gradient(ellipse 86% 74% at 50% 38%, rgba(255,220,150,0.78) 0%, rgba(248,195,95,0.52) 28%, rgba(215,155,55,0.3) 52%, rgba(170,110,35,0.1) 70%, transparent 82%)";

/** 与 intro 里 Past / Present / Future 标签相同的底、边线；悬停时略提亮（spread 牌背悬停复用同一套） */
const MENU_PILL_BASE =
  "bg-purple-900/40 border border-purple-700/60 text-purple-200 transition-all duration-200";
const MENU_PILL_HOVER =
  "hover:bg-purple-900/55 hover:border-purple-500/80 hover:text-purple-100";

export default function TarotPage() {
  const { t } = useLang();
  const [phase, setPhase] = useState<Phase>("intro");

  const startDraw = useCallback(() => {
    setPhase("shuffle");
  }, []);

  const finishShuffle = useCallback((_seed: number, _pickedOrientations: boolean[]) => {
    // 选满并收扇后留在洗牌舞台，不再跳转结果页。
  }, []);

  const cancelShuffle = useCallback(() => {
    setPhase("intro");
  }, []);

  // ── Shuffle (Pixi + Matter) ───────────────────────────────────────────────
  if (phase === "shuffle") {
    return (
      <div className="mx-auto flex h-[86vh] max-h-[86vh] w-[min(70vw,calc(100vw-1.5rem))] max-w-full min-h-0 flex-col px-2 sm:px-3 pt-4 pb-3">
        <div className="min-h-0 flex-1 overflow-hidden">
          <TarotShuffleStage onComplete={finishShuffle} onBack={cancelShuffle} />
        </div>
        <div className="shrink-0 pt-2 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← {t.home}
          </Link>
        </div>
      </div>
    );
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card p-10 text-center space-y-6 animate-fade-in">
          <div className="text-6xl">🔮</div>
          <h1 className="text-3xl font-extrabold text-white">
            {t.tarotIntroTitle}
          </h1>
          <p className="text-gray-400 leading-relaxed max-w-md mx-auto">
            {t.tarotIntroDesc}
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {(["tarotPast", "tarotPresent", "tarotFuture"] as const).map(
              (k) => (
                <span
                  key={k}
                  className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full",
                    MENU_PILL_BASE,
                    MENU_PILL_HOVER
                  )}
                >
                  {t[k]}
                </span>
              )
            )}
          </div>

          <div className="flex flex-col items-center gap-2 pt-4">
            <button
              type="button"
              onClick={startDraw}
              aria-label={t.tarotClickDeckHint}
              className="group/deck relative w-36 sm:w-44 aspect-[2/3] max-w-full cursor-pointer overflow-hidden rounded-xl border-0 bg-transparent p-0 shadow-[0_14px_28px_-10px_rgba(0,0,0,0.65),0_6px_14px_-6px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/[0.08] transition-[transform,box-shadow] duration-200 isolation-isolate hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-12px_rgba(0,0,0,0.7),0_10px_22px_-8px_rgba(0,0,0,0.5),0_0_18px_3px_rgba(245,190,90,0.28),0_0_40px_8px_rgba(200,130,40,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:translate-y-0"
            >
              <div
                className="absolute inset-0 bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: `url('${CARD_BACK_PATH}')` }}
              />
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover/deck:opacity-100"
                style={{
                  mixBlendMode: "screen",
                  background: CARD_BACK_SCREEN_GLOW,
                  ...MASK_LUMINANCE,
                  WebkitMaskImage: `url('${CARD_BACK_MASK_PATH}')`,
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: `url('${CARD_BACK_MASK_PATH}')`,
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat",
                }}
              />
            </button>
            <p className="text-sm text-gray-500">{t.tarotClickDeckHint}</p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← {t.home}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
