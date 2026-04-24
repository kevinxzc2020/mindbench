"use client";

import Link from "next/link";
import { useState } from "react";
import { MAJOR_ARCANA } from "@/lib/tarot-data";
import { useLang } from "@/lib/language-context";

const FOOL_FACE_PATH = "/resources/card/fool.png";
const FOOL_MASK_PATH = "/resources/card/foolmask.png";

const MASK_LUMINANCE = {
  WebkitMaskMode: "luminance" as const,
  maskMode: "luminance" as const,
};

export default function TarotCardsBrowserPage() {
  const { lang, t } = useLang();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">
              Tarot
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Card Browser
            </h1>
            <p className="text-sm text-gray-400">
              All 22 Major Arcana card faces, in order.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/tarot" className="btn-ghost px-4 py-2 text-sm text-center">
              ← Back to Tarot
            </Link>
            <Link href="/" className="btn-ghost px-4 py-2 text-sm text-center">
              ← {t.home}
            </Link>
          </div>
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {MAJOR_ARCANA.map((card) => (
            <div key={card.id} className="space-y-2">
              <div
                className="group/card relative aspect-[2/3] rounded-xl border-2 border-purple-400/60 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 shadow-xl shadow-purple-900/50 overflow-visible transition-shadow duration-250 hover:shadow-[0_0_24px_rgba(168,85,247,0.55)]"
                onMouseEnter={() => setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId((id) => (id === card.id ? null : id))}
              >
                {card.id === 0 ? (
                  <>
                    <div className="absolute inset-0 rounded-[10px] overflow-hidden">
                      <div
                        className="absolute inset-[2px] bg-center bg-contain bg-no-repeat transition-[filter] duration-250"
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
                          filter:
                            hoveredId === card.id
                              ? "brightness(1.08)"
                              : "brightness(1)",
                        }}
                      />
                    </div>
                    <div
                      className="pointer-events-none absolute inset-[1px] transition-opacity duration-250"
                      style={{
                        opacity: hoveredId === card.id ? 1 : 0,
                        background:
                          "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.55) 0%, rgba(168,85,247,0.26) 55%, rgba(168,85,247,0) 80%)",
                        ...MASK_LUMINANCE,
                        WebkitMaskImage: `url('${FOOL_MASK_PATH}')`,
                        WebkitMaskPosition: "center",
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskSize: "contain",
                        maskImage: `url('${FOOL_MASK_PATH}')`,
                        maskPosition: "center",
                        maskRepeat: "no-repeat",
                        maskSize: "contain",
                        filter: "blur(1.2px)",
                        mixBlendMode: "screen",
                      }}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-between p-3">
                    <div className="text-xs font-bold text-purple-300 tracking-widest w-full">
                      {card.id.toString().padStart(2, "0")}
                    </div>
                    <div className="text-5xl sm:text-6xl drop-shadow-[0_0_12px_rgba(180,120,255,0.5)]">
                      {card.emoji}
                    </div>
                    <div className="text-center text-[11px] sm:text-xs font-bold text-white leading-tight">
                      {card.name[lang]}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-purple-200 font-semibold">
                #{card.id.toString().padStart(2, "0")} {card.name[lang]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

