"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { MBTI_TYPES } from "@/lib/mbti-data";
import { SCENARIOS, calculateMbtiType } from "@/lib/mbti-scenarios";
import { cn } from "@/lib/utils";

type Phase = "intro" | "questions" | "result";

// Option letters shown as A/B/C/D
const OPT_LETTERS = ["A", "B", "C", "D"] as const;

export default function MbtiPage() {
  const { t, lang } = useLang();
  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0); // scenario index
  // answers: scenarioId → selected option index
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<string | null>(null);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null); // flash feedback

  const totalQuestions = SCENARIOS.length;

  function startTest() {
    setCurrent(0);
    setAnswers({});
    setResult(null);
    setChosenIdx(null);
    setPhase("questions");
  }

  function handleAnswer(optIdx: number) {
    if (chosenIdx !== null) return; // debounce double-tap
    setChosenIdx(optIdx);

    const s = SCENARIOS[current];
    const newAnswers = { ...answers, [s.id]: optIdx };

    setTimeout(() => {
      if (current + 1 < totalQuestions) {
        setAnswers(newAnswers);
        setCurrent(current + 1);
        setChosenIdx(null);
      } else {
        // Finished
        const type = calculateMbtiType(newAnswers);
        setAnswers(newAnswers);
        setResult(type);
        setPhase("result");
      }
    }, 300);
  }

  function goBack() {
    if (current === 0) return;
    const prevScenario = SCENARIOS[current - 1];
    // Clear the previous answer so user can re-answer if they want
    const newAnswers = { ...answers };
    delete newAnswers[prevScenario.id];
    setAnswers(newAnswers);
    setCurrent(current - 1);
    setChosenIdx(null);
  }

  // ── Intro screen ────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card p-10 text-center space-y-6 animate-fade-in">
          <div className="text-6xl">🧬</div>
          <h1 className="text-3xl font-extrabold text-white">{t.mbtiIntroTitle}</h1>
          <p className="text-gray-400 leading-relaxed max-w-md mx-auto">{t.mbtiIntroDesc}</p>
          <div className="inline-block bg-gray-800 rounded-full px-4 py-1.5 text-xs text-gray-400 font-medium">
            {totalQuestions} {lang === "zh" ? "个场景" : lang === "es" ? "escenarios" : "scenarios"} · 2–3 min
          </div>

          {/* Dimension pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {["E/I", "S/N", "T/F", "J/P"].map((dim) => (
              <span key={dim} className="bg-brand-900/50 border border-brand-700 text-brand-300 text-xs font-bold px-3 py-1 rounded-full">
                {dim}
              </span>
            ))}
          </div>

          <button
            onClick={startTest}
            className="btn-primary px-10 py-3 text-base mt-2"
          >
            {t.mbtiStart}
          </button>

          <div className="pt-2">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← {t.home}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Questions screen ────────────────────────────────────────────────────────
  if (phase === "questions") {
    const s = SCENARIOS[current];
    const progress = current / totalQuestions;

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs text-gray-500 font-medium">
            <span>{t.mbtiQuestionOf} {current + 1} {t.mbtiOf} {totalQuestions}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="card p-8 space-y-5 animate-fade-in" key={current}>
          {/* Dimension badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
              {s.dimension === "EI" ? "E / I" : s.dimension === "SN" ? "S / N" : s.dimension === "TF" ? "T / F" : "J / P"}
            </span>
          </div>

          {/* Scenario context — gray, italic-feel, sets up the situation */}
          <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-gray-700 pl-4">
            {s.scenario[lang]}
          </p>

          {/* Specific question — big and bold */}
          <p className="text-xl font-semibold text-white leading-snug">
            {s.question[lang]}
          </p>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {s.options.map((opt, idx) => {
              const isChosen = chosenIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={chosenIdx !== null}
                  className={cn(
                    "w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all duration-200 flex items-start gap-3",
                    isChosen
                      ? "bg-brand-600 border-brand-500 text-white scale-[0.99]"
                      : "bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white",
                    chosenIdx !== null && !isChosen ? "opacity-40" : ""
                  )}
                >
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-current text-xs font-bold flex-shrink-0 mt-0.5">
                    {OPT_LETTERS[idx]}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt.label[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Back button (only from scenario 2 onward) */}
        {current > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={goBack}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Result screen ────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const typeInfo = MBTI_TYPES.find((tp) => tp.type === result);

    if (!typeInfo) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400">Unknown type: {result}</p>
          <button onClick={startTest} className="btn-primary mt-4">{t.mbtiRetake}</button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5 animate-fade-in">
        {/* Type card */}
        <div className={cn("card p-8 text-center space-y-4 bg-gradient-to-br", typeInfo.color, "border-0")}>
          <p className="text-sm font-semibold text-white/70 uppercase tracking-widest">{t.mbtiYourType}</p>
          <div className="text-7xl">{typeInfo.emoji}</div>
          <div>
            <p className="text-5xl font-black text-white tracking-wider">{typeInfo.type}</p>
            <p className="text-xl font-bold text-white/90 mt-1">{typeInfo.nickname[lang]}</p>
            <p className="text-sm text-white/70 mt-1 italic">{typeInfo.tagline[lang]}</p>
          </div>
        </div>

        {/* Description */}
        <div className="card p-6 space-y-2">
          <p className="text-gray-300 leading-relaxed">{typeInfo.description[lang]}</p>
        </div>

        {/* Strengths & weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-green-400 uppercase tracking-wide">✦ {t.mbtiStrengths}</h3>
            <ul className="space-y-1.5">
              {typeInfo.strengths[lang].map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">◈ {t.mbtiWeaknesses}</h3>
            <ul className="space-y-1.5">
              {typeInfo.weaknesses[lang].map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startTest}
            className="flex-1 btn-primary py-3"
          >
            {t.mbtiRetake}
          </button>
          <Link href="/" className="flex-1 btn-ghost py-3 text-center">
            ← {t.home}
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
