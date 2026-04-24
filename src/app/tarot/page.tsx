"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { drawThreeCardsSeeded } from "@/lib/tarot-seeded";
import { MAJOR_ARCANA, type DrawnCard } from "@/lib/tarot-data";
import { TarotShuffleStage } from "./TarotShuffleStage";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Phase = "intro" | "shuffle" | "spread" | "result";

const POSITION_LABELS = ["tarotPast", "tarotPresent", "tarotFuture"] as const;
const FLIP_MS = 700;
const DECK_SIZE = MAJOR_ARCANA.length;
const SHUFFLE_MS = 900;
const DEAL_TOTAL_MS = 5000;
const DEAL_FLY_MS = 420;
const DEAL_PRELIFT_MS = 90;
const FOOL_FACE_PATH = "/resources/card/fool.png";
const FOOL_MASK_PATH = "/resources/card/foolmask.png";
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
  const { t, lang } = useLang();
  const [phase, setPhase] = useState<Phase>("intro");
  const [cards, setCards] = useState<DrawnCard[]>([]);
  /** slot 0..DECK_SIZE-1 → 0,1,2 表示是第几次抽的（同一张牌在抽出前为 null） */
  const [slotToPickIndex, setSlotToPickIndex] = useState<
    (0 | 1 | 2 | null)[]
  >(() => Array(DECK_SIZE).fill(null));
  const [isDealing, setIsDealing] = useState(false);
  const [revealedSlots, setRevealedSlots] = useState(0);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dealTargets, setDealTargets] = useState<
    { x: number; y: number; w: number; h: number }[]
  >([]);
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });

  const startDraw = useCallback(() => {
    setPhase("shuffle");
  }, []);

  const finishShuffle = useCallback((seed: number) => {
    setCards(drawThreeCardsSeeded(seed));
    setSlotToPickIndex(Array(DECK_SIZE).fill(null));
    setRevealedSlots(0);
    setIsDealing(true);
    setPhase("spread");
  }, []);

  const cancelShuffle = useCallback(() => {
    setPhase("intro");
  }, []);

  useEffect(() => {
    if (phase !== "spread" || !isDealing) return;
    const dealIntervalMs = Math.max(40, Math.round(DEAL_TOTAL_MS / DECK_SIZE));
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        let shown = 0;
        const tick = () => {
          shown += 1;
          setRevealedSlots(shown);
          if (shown < DECK_SIZE) {
            timers.push(setTimeout(tick, dealIntervalMs));
          } else {
            setIsDealing(false);
          }
        };
        tick();
      }, SHUFFLE_MS)
    );
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [phase, isDealing]);

  useEffect(() => {
    if (phase !== "spread") return;
    const measure = () => {
      const board = boardRef.current;
      if (!board) return;
      const boardRect = board.getBoundingClientRect();
      setBoardSize({ w: boardRect.width, h: boardRect.height });
      const targets = Array.from({ length: DECK_SIZE }, (_, i) => {
        const node = slotRefs.current[i];
        if (!node) return { x: 0, y: 0, w: 0, h: 0 };
        const r = node.getBoundingClientRect();
        return {
          x: r.left - boardRect.left,
          y: r.top - boardRect.top,
          w: r.width,
          h: r.height,
        };
      });
      setDealTargets(targets);
    };
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [phase, isDealing]);

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

        <div ref={boardRef} className="relative">
          {isDealing && dealTargets.length === DECK_SIZE && (
            <div className="pointer-events-none absolute inset-0 z-30">
              {dealTargets.map((tgt, slot) => {
                const dealt = slot < revealedSlots;
                const pileIndex = Math.max(0, DECK_SIZE - 1 - slot);
                const pileYOffset = Math.min(pileIndex * 0.45, 10);
                const pileRotate = ((slot % 5) - 2) * 0.9;
                return (
                  <motion.div
                    key={`deal-${slot}`}
                    className="absolute rounded-xl ring-1 ring-inset ring-white/[0.08] bg-[url('/resources/card/card.png')] bg-cover bg-center shadow-[0_10px_24px_-8px_rgba(0,0,0,0.55)]"
                    style={{
                      width: tgt.w,
                      height: tgt.h,
                      left: "50%",
                      top: "50%",
                      marginLeft: -(tgt.w / 2),
                      marginTop: -(tgt.h / 2),
                      zIndex: dealt ? 10 + slot : 1000 + pileIndex,
                    }}
                    initial={false}
                    animate={
                      dealt
                        ? {
                            x: [
                              0,
                              0,
                              tgt.x - (boardSize.w / 2 - tgt.w / 2),
                            ],
                            y: [
                              pileYOffset,
                              pileYOffset - 12,
                              tgt.y - (boardSize.h / 2 - tgt.h / 2),
                            ],
                            rotate: [pileRotate, pileRotate + (slot % 2 === 0 ? -5 : 5), 0],
                            scale: [1, 1.03, 1],
                            opacity: [1, 1, 0],
                          }
                        : {
                            x: 0,
                            y: pileYOffset,
                            rotate: pileRotate,
                            scale: 1,
                            opacity: 1,
                          }
                    }
                    transition={
                      dealt
                        ? {
                            duration: DEAL_FLY_MS / 1000,
                            times: [0, DEAL_PRELIFT_MS / DEAL_FLY_MS, 1],
                            ease: "easeInOut",
                          }
                        : {
                            duration: 0.2,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                  />
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: DECK_SIZE }, (_, slot) => {
              const pickIndex = slotToPickIndex[slot];
              const isFlipped = pickIndex !== null;
              const drawn = isFlipped ? cards[pickIndex]! : null;
              return (
                <div
                  key={slot}
                  ref={(el) => {
                    slotRefs.current[slot] = el;
                  }}
                >
                  <SpreadFlippableCard
                    isFlipped={isFlipped}
                    drawn={drawn}
                    isRevealed={slot < revealedSlots}
                    disabled={
                      isDealing || slot >= revealedSlots || (!isFlipped && pickCount >= 3)
                    }
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
                </div>
              );
            })}
          </div>
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
  isRevealed,
  lang,
  uprightLabel,
  reversedLabel,
  positionLabel,
}: {
  isFlipped: boolean;
  drawn: DrawnCard | null;
  onClick: () => void;
  disabled: boolean;
  isRevealed: boolean;
  lang: "en" | "es" | "zh";
  uprightLabel: string;
  reversedLabel: string;
  positionLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 min-w-0 transition-all duration-300",
        isRevealed
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-2 scale-95"
      )}
    >
      {positionLabel && (
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-purple-400 font-bold truncate max-w-full">
          {positionLabel}
        </span>
      )}
      <div className="w-full [perspective:1000px] aspect-[2/3]">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isFlipped}
          className={cn(
            "group/cardback relative w-full p-0 rounded-xl origin-center block",
            "h-full rounded-xl shadow-[0_14px_28px_-10px_rgba(0,0,0,0.65),0_6px_14px_-6px_rgba(0,0,0,0.45),0_2px_6px_-2px_rgba(0,0,0,0.35)]",
            "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
            isFlipped && "border-2 border-transparent bg-transparent",
            !isFlipped && "border-2 border-purple-700/60 bg-purple-900/40",
            !isFlipped &&
              !disabled &&
              cn(
                "cursor-pointer",
                MENU_PILL_HOVER,
                "hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-12px_rgba(0,0,0,0.7),0_10px_22px_-8px_rgba(0,0,0,0.5),0_0_22px_-4px_rgba(124,58,237,0.35)] active:scale-[0.99] active:translate-y-0 active:border-purple-700/60 active:bg-purple-900/40 active:shadow-[0_10px_20px_-8px_rgba(0,0,0,0.55),0_4px_10px_-4px_rgba(0,0,0,0.4)]"
              ),
            !isFlipped && disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div
            className={cn(
              "relative w-full h-full [transform-style:preserve-3d] transition-transform ease-out",
              isFlipped && "[transform:rotateY(180deg)]"
            )}
            style={{ transitionDuration: `${FLIP_MS}ms` }}
          >
            {/* 牌背 (面向观众为 0°) */}
            <div
              className={cn(
                "absolute inset-0 overflow-hidden rounded-lg sm:rounded-xl ring-1 ring-inset ring-white/[0.08]",
                "bg-center bg-cover bg-no-repeat",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-14px_28px_-8px_rgba(0,0,0,0.42)]",
                "isolation-isolate",
                "[backface-visibility:hidden] [transform:rotateY(0deg)]"
              )}
              style={{ backgroundImage: `url('${CARD_BACK_PATH}')` }}
            >
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-white/[0.06] via-transparent to-black/40 pointer-events-none" />
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-black/10 pointer-events-none" />
            </div>

            {/* 牌面 (在背面，初始 rotateY(180)) */}
            <div
              className={cn(
                "absolute inset-0 rounded-lg sm:rounded-xl border-2 border-purple-400/60",
                "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900",
                "flex flex-col items-center justify-between p-1.5 sm:p-2.5",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-12px_24px_-6px_rgba(0,0,0,0.45)]",
                "[backface-visibility:hidden] [transform:rotateY(180deg)]"
              )}
            >
              {drawn && (
                <>
                  {drawn.card.id === 0 ? (
                    <div className="w-full h-full p-0.5">
                      <div
                        className={cn(
                          "w-full h-full bg-center bg-contain bg-no-repeat",
                          drawn.reversed && "rotate-180"
                        )}
                        style={{
                          backgroundImage: `url('${FOOL_FACE_PATH}')`,
                          ...MASK_LUMINANCE,
                          WebkitMaskImage: `url('${FOOL_MASK_PATH}')`,
                          WebkitMaskPosition: "center",
                          WebkitMaskRepeat: "no-repeat",
                          WebkitMaskSize: "contain",
                          maskImage: `url('${FOOL_MASK_PATH}')`,
                          maskPosition: "center",
                          maskRepeat: "no-repeat",
                          maskSize: "contain",
                          filter: "drop-shadow(0 0 5px rgba(168, 85, 247, 0.35))",
                        }}
                      />
                    </div>
                  ) : (
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
          drawn.card.id === 0
            ? "flex items-center justify-center p-2"
            : "flex flex-col items-center justify-between p-4",
          "shadow-xl shadow-purple-900/50",
          drawn.reversed && "rotate-180"
        )}
      >
        {drawn.card.id === 0 ? (
          <div
            className="w-full h-full bg-center bg-contain bg-no-repeat"
            style={{
              backgroundImage: `url('${FOOL_FACE_PATH}')`,
              ...MASK_LUMINANCE,
              WebkitMaskImage: `url('${FOOL_MASK_PATH}')`,
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskImage: `url('${FOOL_MASK_PATH}')`,
              maskPosition: "center",
              maskRepeat: "no-repeat",
              maskSize: "contain",
              filter: "drop-shadow(0 0 5px rgba(168, 85, 247, 0.35))",
            }}
          />
        ) : (
          <>
            <div className="text-xs font-bold text-purple-300 tracking-widest">
              {drawn.card.id.toString().padStart(2, "0")}
            </div>
            <div className="text-6xl drop-shadow-[0_0_12px_rgba(180,120,255,0.5)]">
              {drawn.card.emoji}
            </div>
            <div className="text-center text-xs font-bold text-white leading-tight">
              {drawn.card.name[lang]}
            </div>
          </>
        )}
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
