"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { drawThreeCards, MAJOR_ARCANA, type DrawnCard } from "@/lib/tarot-data";
import { cn } from "@/lib/utils";

type Phase = "intro" | "spread" | "result";

const POSITION_LABELS = ["tarotPast", "tarotPresent", "tarotFuture"] as const;
const FLIP_MS = 700;
const DECK_SIZE = MAJOR_ARCANA.length;

export default function TarotPage() {
  const { t, lang } = useLang();
  const [phase, setPhase] = useState<Phase>("intro");
  const [cards, setCards] = useState<DrawnCard[]>([]);
  /** slot 0..DECK_SIZE-1 → 0,1,2 表示是第几次抽的（同一张牌在抽出前为 null） */
  const [slotToPickIndex, setSlotToPickIndex] = useState<
    (0 | 1 | 2 | null)[]
  >(() => Array(DECK_SIZE).fill(null));

  const startDraw = useCallback(() => {
    setCards(drawThreeCards());
    setSlotToPickIndex(Array(DECK_SIZE).fill(null));
    setPhase("spread");
  }, []);

  const onPickSlot = useCallback(
    (slot: number) => {
      if (phase !== "spread") return;
      setSlotToPickIndex((prev) => {
        if (prev[slot] !== null) return prev;
        const n = prev.filter((x) => x !== null).length;
        if (n >= 3) return prev;
        const next: (0 | 1 | 2 | null)[] = [...prev];
        next[slot] = n as 0 | 1 | 2;
        if (n === 2) {
          setTimeout(() => setPhase("result"), FLIP_MS + 120);
        }
        return next;
      });
    },
    [phase]
  );

  const drawAgain = useCallback(() => {
    setPhase("intro");
    setCards([]);
    setSlotToPickIndex(Array(DECK_SIZE).fill(null));
  }, []);

  const pickCount = slotToPickIndex.filter((x) => x !== null).length;

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
                  className="bg-purple-900/40 border border-purple-700/60 text-purple-200 text-xs font-bold px-3 py-1 rounded-full"
                >
                  {t[k]}
                </span>
              )
            )}
          </div>

          <button
            onClick={startDraw}
            className="btn-primary px-10 py-3 text-base mt-2"
          >
            {t.tarotStart}
          </button>

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

  // ── Spread: full deck, click to draw with flip ─────────────────────────────
  if (phase === "spread") {
    return (
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-8 space-y-5 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-white">{t.tarotTitle}</h1>
          <p className="text-sm text-gray-400">{t.tarotDesc}</p>
          <p className="text-sm text-purple-200/90 max-w-xl mx-auto leading-relaxed">
            {t.tarotSpreadInstruction}
          </p>
          <p className="text-sm font-semibold text-amber-200/90 tabular-nums">
            {t.tarotPicked} {pickCount}/3
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-2.5">
          {Array.from({ length: DECK_SIZE }, (_, slot) => {
            const pickIndex = slotToPickIndex[slot];
            const isFlipped = pickIndex !== null;
            const drawn = isFlipped ? cards[pickIndex]! : null;
            return (
              <SpreadFlippableCard
                key={slot}
                isFlipped={isFlipped}
                drawn={drawn}
                disabled={!isFlipped && pickCount >= 3}
                onClick={() => onPickSlot(slot)}
                lang={lang}
                uprightLabel={t.tarotUpright}
                reversedLabel={t.tarotReversed}
                positionLabel={
                  isFlipped && pickIndex !== null
                    ? t[POSITION_LABELS[pickIndex]]
                    : undefined
                }
              />
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← {t.home}
          </Link>
        </div>
      </div>
    );
  }

  // ── Result (interpretations) ──────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-white">{t.tarotTitle}</h1>
        <p className="text-sm text-gray-400">{t.tarotDesc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((drawn, i) => {
          const posLabelKey = POSITION_LABELS[i];
          return (
            <CardSummary
              key={i}
              drawn={drawn}
              positionLabel={t[posLabelKey]}
              lang={lang}
              uprightLabel={t.tarotUpright}
              reversedLabel={t.tarotReversed}
            />
          );
        })}
      </div>

      <div className="space-y-4 animate-fade-in">
        {cards.map((drawn, i) => {
          const posLabelKey = POSITION_LABELS[i];
          const text = drawn.reversed
            ? drawn.card.reversed[lang]
            : drawn.card.upright[lang];
          return (
            <div key={i} className="card p-5 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{drawn.card.emoji}</span>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-purple-400 font-bold">
                    {t[posLabelKey]}
                  </p>
                  <p className="text-lg font-bold text-white">
                    {drawn.card.name[lang]}
                    <span
                      className={cn(
                        "ml-2 text-xs font-semibold px-2 py-0.5 rounded-full",
                        drawn.reversed
                          ? "bg-amber-900/40 text-amber-300 border border-amber-700/60"
                          : "bg-emerald-900/40 text-emerald-300 border border-emerald-700/60"
                      )}
                    >
                      {drawn.reversed ? t.tarotReversed : t.tarotUpright}
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic pl-12">
                {drawn.card.keywords[lang]}
              </p>
              <p className="text-gray-300 leading-relaxed pl-12">{text}</p>
            </div>
          );
        })}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button onClick={drawAgain} className="flex-1 btn-primary py-3">
            🔮 {t.tarotDrawAgain}
          </button>
          <Link href="/" className="flex-1 btn-ghost py-3 text-center">
            ← {t.home}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Spread: 3D flip (back → front) ─────────────────────────────────────────

function SpreadFlippableCard({
  isFlipped,
  drawn,
  onClick,
  disabled,
  lang,
  uprightLabel,
  reversedLabel,
  positionLabel,
}: {
  isFlipped: boolean;
  drawn: DrawnCard | null;
  onClick: () => void;
  disabled: boolean;
  lang: "en" | "es" | "zh";
  uprightLabel: string;
  reversedLabel: string;
  positionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      {positionLabel && (
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-purple-400 font-bold truncate max-w-full">
          {positionLabel}
        </span>
      )}
      <div className="w-full [perspective:1000px] min-h-[7.5rem] sm:min-h-[8.5rem]">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isFlipped}
          className={cn(
            "relative w-full p-0 border-0 bg-transparent rounded-xl origin-center block",
            "min-h-[7.5rem] sm:min-h-[8.5rem] max-h-[9rem]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-xl",
            !isFlipped &&
              !disabled &&
              "cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-transform",
            disabled && !isFlipped && "cursor-not-allowed opacity-50"
          )}
        >
          <div
            className={cn(
              "relative w-full h-full min-h-[7.5rem] sm:min-h-[8.5rem] [transform-style:preserve-3d] transition-transform ease-out",
              isFlipped && "[transform:rotateY(180deg)]"
            )}
            style={{ transitionDuration: `${FLIP_MS}ms` }}
          >
            {/* 牌背 (面向观众为 0°) */}
            <div
              className={cn(
                "absolute inset-0 rounded-lg sm:rounded-xl border-2 border-purple-500/40",
                "bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900",
                "flex items-center justify-center",
                "shadow-md shadow-purple-900/30",
                "[backface-visibility:hidden] [transform:rotateY(0deg)]"
              )}
            >
              <div className="text-2xl sm:text-3xl opacity-40">✦</div>
              <div
                className="absolute inset-0 rounded-lg sm:rounded-xl opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 6px)",
                }}
              />
            </div>

            {/* 牌面 (在背面，初始 rotateY(180)) */}
            <div
              className={cn(
                "absolute inset-0 rounded-lg sm:rounded-xl border-2 border-purple-400/60",
                "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900",
                "flex flex-col items-center justify-between p-1.5 sm:p-2.5",
                "shadow-md shadow-purple-900/50",
                "[backface-visibility:hidden] [transform:rotateY(180deg)]"
              )}
            >
              {drawn && (
                <>
                  <div className="text-[9px] sm:text-xs font-bold text-purple-300 tracking-widest w-full text-left">
                    {drawn.card.id.toString().padStart(2, "0")}
                  </div>
                  <div
                    className={cn(
                      "text-2xl sm:text-4xl drop-shadow-[0_0_10px_rgba(180,120,255,0.5)]",
                      drawn.reversed && "rotate-180"
                    )}
                  >
                    {drawn.card.emoji}
                  </div>
                  <div
                    className="text-center text-[8px] sm:text-[10px] font-bold text-white leading-tight line-clamp-3 px-0.5 w-full"
                    style={{ lineHeight: 1.15 }}
                  >
                    {drawn.card.name[lang]}
                  </div>
                </>
              )}
            </div>
          </div>
        </button>
      </div>
      {isFlipped && drawn && (
        <span
          className={cn(
            "text-[9px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full text-center",
            drawn.reversed
              ? "bg-amber-900/40 text-amber-300"
              : "bg-emerald-900/40 text-emerald-300"
          )}
        >
          {drawn.reversed ? reversedLabel : uprightLabel}
        </span>
      )}
    </div>
  );
}

// ─── Result row: 静态三牌展示 ──────────────────────────────────────────────

function CardSummary({
  drawn,
  positionLabel,
  lang,
  uprightLabel,
  reversedLabel,
}: {
  drawn: DrawnCard;
  positionLabel: string;
  lang: "en" | "es" | "zh";
  uprightLabel: string;
  reversedLabel: string;
}) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">
        {positionLabel}
      </span>
      <div
        className={cn(
          "relative w-full max-w-[200px] aspect-[2/3] rounded-xl border-2 border-purple-400/60",
          "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900",
          "flex flex-col items-center justify-between p-4",
          "shadow-xl shadow-purple-900/50",
          drawn.reversed && "rotate-180"
        )}
      >
        <div className="text-xs font-bold text-purple-300 tracking-widest">
          {drawn.card.id.toString().padStart(2, "0")}
        </div>
        <div className="text-6xl drop-shadow-[0_0_12px_rgba(180,120,255,0.5)]">
          {drawn.card.emoji}
        </div>
        <div className="text-center text-xs font-bold text-white leading-tight">
          {drawn.card.name[lang]}
        </div>
      </div>
      <span
        className={cn(
          "text-xs font-semibold px-2 py-0.5 rounded-full",
          drawn.reversed
            ? "bg-amber-900/40 text-amber-300"
            : "bg-emerald-900/40 text-emerald-300"
        )}
      >
        {drawn.reversed ? reversedLabel : uprightLabel}
      </span>
    </div>
  );
}
