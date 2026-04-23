"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { drawThreeCards, type DrawnCard } from "@/lib/tarot-data";
import { cn } from "@/lib/utils";

type Phase = "intro" | "drawing" | "result";

const POSITION_LABELS = ["tarotPast", "tarotPresent", "tarotFuture"] as const;

export default function TarotPage() {
  const { t, lang } = useLang();
  const [phase, setPhase] = useState<Phase>("intro");
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState<number>(-1); // -1 = none revealed yet

  function startDraw() {
    const drawn = drawThreeCards();
    setCards(drawn);
    setRevealed(-1);
    setPhase("drawing");

    // Reveal cards one by one
    drawn.forEach((_, i) => {
      setTimeout(() => {
        setRevealed(i);
        if (i === drawn.length - 1) {
          // After last reveal, pause briefly then move to result phase
          setTimeout(() => setPhase("result"), 800);
        }
      }, 600 + i * 700);
    });
  }

  function drawAgain() {
    setPhase("intro");
    setCards([]);
    setRevealed(-1);
  }

  // ── Intro screen ────────────────────────────────────────────────────────────
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

  // ── Drawing / Result (shared layout) ────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-white">{t.tarotTitle}</h1>
        <p className="text-sm text-gray-400">{t.tarotDesc}</p>
      </div>

      {/* Three cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((drawn, i) => {
          const isRevealed = i <= revealed;
          const posLabelKey = POSITION_LABELS[i];
          return (
            <CardView
              key={i}
              drawn={drawn}
              positionLabel={t[posLabelKey]}
              revealed={isRevealed}
              lang={lang}
              uprightLabel={t.tarotUpright}
              reversedLabel={t.tarotReversed}
            />
          );
        })}
      </div>

      {/* Detailed interpretations (only in result phase) */}
      {phase === "result" && (
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
            <button
              onClick={drawAgain}
              className="flex-1 btn-primary py-3"
            >
              🔮 {t.tarotDrawAgain}
            </button>
            <Link
              href="/"
              className="flex-1 btn-ghost py-3 text-center"
            >
              ← {t.home}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Individual card visual ─────────────────────────────────────────────────

function CardView({
  drawn,
  positionLabel,
  revealed,
  lang,
  uprightLabel,
  reversedLabel,
}: {
  drawn: DrawnCard;
  positionLabel: string;
  revealed: boolean;
  lang: "en" | "es" | "zh";
  uprightLabel: string;
  reversedLabel: string;
}) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">
        {positionLabel}
      </span>

      {/* Card (flipped or not) */}
      <div
        className={cn(
          "relative w-full max-w-[200px] aspect-[2/3] rounded-xl transition-all duration-500 preserve-3d",
          "[transform-style:preserve-3d]"
        )}
      >
        {/* Back of card (shown until revealed) */}
        {!revealed && (
          <div
            className={cn(
              "absolute inset-0 rounded-xl border-2 border-purple-500/40",
              "bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900",
              "flex items-center justify-center",
              "shadow-lg shadow-purple-900/40"
            )}
          >
            <div className="text-5xl opacity-40">✦</div>
            <div
              className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 8px)",
              }}
            />
          </div>
        )}

        {/* Front of card (shown after revealed) */}
        {revealed && (
          <div
            className={cn(
              "absolute inset-0 rounded-xl border-2 border-purple-400/60",
              "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900",
              "flex flex-col items-center justify-between p-4",
              "shadow-xl shadow-purple-900/50 animate-fade-in",
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
        )}
      </div>

      {/* Orientation tag (shown only when revealed) */}
      {revealed && (
        <span
          className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full animate-fade-in",
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
