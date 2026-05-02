"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
type Section = "numerical" | "verbal" | "logical" | "pattern" | "abstract";

interface IQQuestion {
  id: number;
  section: Section;
  question: string;
  // For pattern questions: grid cells (8 known + 1 "?")
  grid?: string[];
  options: string[];
  correctIdx: number;
  weight: 1 | 2 | 3; // difficulty weight for scoring
}

// ─── Question Bank ──────────────────────────────────────────────────────────
const QUESTIONS: IQQuestion[] = [
  // ═════════ 1. NUMERICAL REASONING ═══════════════════════════════════════
  {
    id: 1, section: "numerical", weight: 1,
    question: "What comes next?\n2,  5,  8,  11,  ___",
    options: ["12", "13", "14", "15"],
    correctIdx: 2,
  },
  {
    id: 2, section: "numerical", weight: 2,
    question: "What comes next?\n1,  2,  6,  24,  120,  ___",
    options: ["240", "360", "480", "720"],
    correctIdx: 3,
  },
  {
    id: 3, section: "numerical", weight: 2,
    question: "What comes next?\n100,  90,  81,  73,  66,  ___",
    options: ["58", "60", "62", "64"],
    correctIdx: 1,
  },
  {
    id: 4, section: "numerical", weight: 3,
    question: "What comes next?\n1,  3,  6,  10,  15,  ___",
    options: ["18", "19", "20", "21"],
    correctIdx: 3,
  },

  // ═════════ 2. VERBAL ANALOGIES ══════════════════════════════════════════
  {
    id: 5, section: "verbal", weight: 1,
    question: "Eye is to See\nas Ear is to ___",
    options: ["Sound", "Hear", "Listen", "Music"],
    correctIdx: 1,
  },
  {
    id: 6, section: "verbal", weight: 2,
    question: "Tree is to Forest\nas Star is to ___",
    options: ["Sky", "Night", "Galaxy", "Universe"],
    correctIdx: 2,
  },
  {
    id: 7, section: "verbal", weight: 2,
    question: "Thermometer is to Temperature\nas Barometer is to ___",
    options: ["Weather", "Wind", "Rain", "Pressure"],
    correctIdx: 3,
  },
  {
    id: 8, section: "verbal", weight: 3,
    question: "Archipelago is to Islands\nas Constellation is to ___",
    options: ["Space", "Universe", "Stars", "Planets"],
    correctIdx: 2,
  },

  // ═════════ 3. LOGICAL DEDUCTION ════════════════════════════════════════
  {
    id: 9, section: "logical", weight: 1,
    question: "All cats are mammals.\nAll mammals are warm-blooded.\nTherefore:",
    options: [
      "All cats are warm-blooded",
      "Some cats are warm-blooded",
      "All warm-blooded animals are cats",
      "Cannot be determined",
    ],
    correctIdx: 0,
  },
  {
    id: 10, section: "logical", weight: 1,
    question: "If A > B and C > A, then:",
    options: ["B > C", "C > B", "A > C", "B = C"],
    correctIdx: 1,
  },
  {
    id: 11, section: "logical", weight: 2,
    question: "A store discounts 20%, then takes an additional 10% off the sale price.\nWhat is the total discount?",
    options: ["25%", "28%", "30%", "27%"],
    correctIdx: 1,
  },
  {
    id: 12, section: "logical", weight: 3,
    question: "Tom is 3× his son's age now.\nIn 10 years, Tom will be 2× his son's age.\nHow old is the son now?",
    options: ["5", "8", "10", "12"],
    correctIdx: 2,
  },

  // ═════════ 4. PATTERN RECOGNITION (3×3 grids) ══════════════════════════
  {
    id: 13, section: "pattern", weight: 1,
    question: "Find the missing piece in the grid:",
    grid: ["🔴","🔵","🟢", "🔵","🟢","🔴", "🟢","🔴","?"],
    options: ["🔴", "🔵", "🟢", "⚫"],
    correctIdx: 1,
  },
  {
    id: 14, section: "pattern", weight: 2,
    question: "Find the missing number in the grid:",
    grid: ["2","4","8", "3","9","27", "4","16","?"],
    options: ["32", "48", "56", "64"],
    correctIdx: 3,
  },
  {
    id: 15, section: "pattern", weight: 2,
    question: "Find the missing letter in the grid:",
    grid: ["A","Z","B", "Y","C","X", "D","W","?"],
    options: ["E", "V", "F", "U"],
    correctIdx: 0,
  },
  {
    id: 16, section: "pattern", weight: 3,
    question: "Find the missing number in the grid:",
    grid: ["3","6","9", "5","10","15", "7","14","?"],
    options: ["17", "18", "19", "21"],
    correctIdx: 3,
  },

  // ═════════ 5. ABSTRACT REASONING ═══════════════════════════════════════
  {
    id: 17, section: "abstract", weight: 1,
    question: "Which one does NOT belong?\nApple · Orange · Banana · Carrot · Grape",
    options: ["Apple", "Orange", "Carrot", "Grape"],
    correctIdx: 2,
  },
  {
    id: 18, section: "abstract", weight: 2,
    question: "Which number does NOT belong?\n2,  3,  5,  7,  11,  14,  17",
    options: ["3", "7", "14", "17"],
    correctIdx: 2,
  },
  {
    id: 19, section: "abstract", weight: 2,
    question: "Which shape does NOT belong?\nTriangle · Square · Pentagon · Cube · Hexagon",
    options: ["Triangle", "Square", "Cube", "Hexagon"],
    correctIdx: 2,
  },
  {
    id: 20, section: "abstract", weight: 3,
    question: "Complete the sequence:\nJ, F, M, A, M, J, J, A, S, O, N, ___",
    options: ["J", "A", "D", "M"],
    correctIdx: 2,
  },
];

const SECTION_META: Record<Section, { label: string; emoji: string; color: string }> = {
  numerical: { label: "Numerical Reasoning",  emoji: "🔢", color: "text-blue-400"   },
  verbal:    { label: "Verbal Analogies",      emoji: "📖", color: "text-green-400"  },
  logical:   { label: "Logical Deduction",     emoji: "🧩", color: "text-yellow-400" },
  pattern:   { label: "Pattern Recognition",   emoji: "🔲", color: "text-violet-400" },
  abstract:  { label: "Abstract Reasoning",    emoji: "🎯", color: "text-rose-400"   },
};

const MAX_SCORE = QUESTIONS.reduce((s, q) => s + q.weight, 0); // = 35

function estimateIQ(score: number): { range: string; label: string; percentile: string; color: string } {
  const pct = score / MAX_SCORE;
  if (pct >= 0.92) return { range: "130+",     label: "Very Superior",  percentile: "Top 2%",   color: "text-violet-400" };
  if (pct >= 0.80) return { range: "120–129",  label: "Superior",       percentile: "Top 10%",  color: "text-blue-400"   };
  if (pct >= 0.65) return { range: "110–119",  label: "High Average",   percentile: "Top 25%",  color: "text-green-400"  };
  if (pct >= 0.45) return { range: "90–109",   label: "Average",        percentile: "Middle 50%",color: "text-yellow-400"};
  if (pct >= 0.30) return { range: "80–89",    label: "Low Average",    percentile: "Bottom 25%",color: "text-orange-400"};
  return               { range: "Below 80",  label: "Below Average",  percentile: "Bottom 10%",color: "text-red-400"    };
}

type Phase = "intro" | "questions" | "result";
const OPT_LETTERS = ["A", "B", "C", "D"] as const;

// ─── Page ────────────────────────────────────────────────────────────────────
export default function IQTestPage() {
  const { lang } = useLang();
  const [phase, setPhase]       = useState<Phase>("intro");
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<Record<number, number>>({});
  const [chosen, setChosen]     = useState<number | null>(null);

  function start() { setPhase("questions"); setCurrent(0); setAnswers({}); setChosen(null); }

  function handleAnswer(optIdx: number) {
    if (chosen !== null) return;
    setChosen(optIdx);
    setTimeout(() => {
      const newAns = { ...answers, [QUESTIONS[current].id]: optIdx };
      setAnswers(newAns);
      if (current + 1 < QUESTIONS.length) {
        setCurrent(current + 1);
        setChosen(null);
      } else {
        setPhase("result");
      }
    }, 350);
  }

  function goBack() {
    if (current === 0) return;
    const prev = QUESTIONS[current - 1];
    const a = { ...answers };
    delete a[prev.id];
    setAnswers(a);
    setCurrent(current - 1);
    setChosen(null);
  }

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card p-10 text-center space-y-6 animate-fade-in">
          <div className="inline-flex w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-violet-700 items-center justify-center text-white shadow-lg">
            <Brain size={32} strokeWidth={2.2} />
          </div>
          <h1 className="text-3xl font-extrabold text-white">IQ Estimation Test</h1>
          <p className="text-gray-400 leading-relaxed max-w-md mx-auto text-sm">
            20 questions across 5 cognitive dimensions. No time limit — take your time on each question.
            Results give an estimated IQ range, not a clinical score.
          </p>

          {/* Section overview */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
            {(Object.entries(SECTION_META) as [Section, typeof SECTION_META[Section]][]).map(([, m]) => (
              <div key={m.label} className="bg-gray-800/60 rounded-xl p-3 text-center">
                <p className="text-2xl">{m.emoji}</p>
                <p className={`text-xs font-semibold mt-1 ${m.color}`}>{m.label.split(" ")[0]}</p>
                <p className="text-xs text-gray-500">4 questions</p>
              </div>
            ))}
          </div>

          <button onClick={start} className="btn-primary px-10 py-3 text-base mt-2">
            Start Test
          </button>
          <div className="pt-2">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Questions ─────────────────────────────────────────────────────────────
  if (phase === "questions") {
    const q    = QUESTIONS[current];
    const meta = SECTION_META[q.section];
    const progress = ((current) / QUESTIONS.length) * 100;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span className={`font-semibold ${meta.color}`}>{meta.emoji} {meta.label}</span>
            <span>{current + 1} / {QUESTIONS.length}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="card p-8 space-y-6">
          {/* Question text */}
          <p className="text-white text-lg font-semibold leading-relaxed whitespace-pre-line text-center">
            {q.question}
          </p>

          {/* Grid display for pattern questions */}
          {q.grid && (
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-2">
                {q.grid.map((cell, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-14 h-14 flex items-center justify-center rounded-xl text-xl font-black border",
                      cell === "?"
                        ? "border-violet-400 bg-violet-900/40 text-violet-400 text-2xl"
                        : "border-white/10 bg-gray-800 text-white"
                    )}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              const isChosen = chosen === i;
              const correct  = q.correctIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={chosen !== null}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left font-medium text-sm transition-all",
                    chosen === null
                      ? "border-white/10 bg-gray-800/60 text-gray-200 hover:border-white/30 hover:bg-gray-700/60"
                      : isChosen && correct
                      ? "border-green-500 bg-green-950/40 text-green-300"
                      : isChosen && !correct
                      ? "border-red-500 bg-red-950/40 text-red-300"
                      : correct
                      ? "border-green-500/40 bg-green-950/20 text-green-400"
                      : "border-white/5 bg-gray-800/30 text-gray-500"
                  )}
                >
                  <span className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0",
                    chosen === null ? "bg-gray-700 text-gray-300" :
                    isChosen && correct ? "bg-green-600 text-white" :
                    isChosen && !correct ? "bg-red-600 text-white" :
                    correct ? "bg-green-700/50 text-green-300" : "bg-gray-800 text-gray-600"
                  )}>
                    {OPT_LETTERS[i]}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav */}
        <div className="flex justify-between">
          <button
            onClick={goBack}
            disabled={current === 0}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-xs text-gray-600">
            Difficulty: {"★".repeat(q.weight)}{"☆".repeat(3 - q.weight)}
          </span>
          {chosen !== null && current + 1 < QUESTIONS.length && (
            <button
              onClick={() => { setCurrent(c => c + 1); setChosen(null); }}
              className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  const totalScore = QUESTIONS.reduce((acc, q) => {
    return acc + (answers[q.id] === q.correctIdx ? q.weight : 0);
  }, 0);

  const iq = estimateIQ(totalScore);

  // Per-section scores
  const sections = Object.keys(SECTION_META) as Section[];
  const sectionScores = sections.map(sec => {
    const qs  = QUESTIONS.filter(q => q.section === sec);
    const got = qs.reduce((a, q) => a + (answers[q.id] === q.correctIdx ? q.weight : 0), 0);
    const max = qs.reduce((a, q) => a + q.weight, 0);
    return { sec, got, max, pct: got / max };
  });

  void lang;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 animate-fade-in">
      <div className="card p-8 text-center space-y-4">
        <Brain size={56} strokeWidth={1.8} className="mx-auto text-blue-400" />
        <p className="text-gray-400 text-sm">Estimated IQ Range</p>
        <p className={`text-6xl font-black tabular-nums ${iq.color}`}>{iq.range}</p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className={`font-bold ${iq.color}`}>{iq.label}</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">{iq.percentile}</span>
        </div>
        <p className="text-xs text-gray-600 max-w-sm mx-auto">
          Score: {totalScore} / {MAX_SCORE} points · This is an estimation for fun, not a clinical assessment.
        </p>
      </div>

      {/* Section breakdown */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">By Dimension</h3>
        {sectionScores.map(({ sec, got, max, pct }) => {
          const m = SECTION_META[sec];
          return (
            <div key={sec} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={`font-semibold ${m.color}`}>{m.emoji} {m.label}</span>
                <span className="text-gray-400 tabular-nums">{got} / {max}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700",
                    pct >= 0.75 ? "bg-green-500" : pct >= 0.5 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Question review */}
      <div className="card p-6 space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Review</h3>
        <div className="grid grid-cols-5 gap-2">
          {QUESTIONS.map((q, i) => {
            const correct = answers[q.id] === q.correctIdx;
            return (
              <div
                key={q.id}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-bold",
                  correct ? "bg-green-900/50 text-green-400 border border-green-700/50"
                           : "bg-red-900/50 text-red-400 border border-red-700/50"
                )}
              >
                <span className="text-[10px] text-gray-500">{i + 1}</span>
                <span>{correct ? "✓" : "✗"}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button onClick={start} className="btn-primary px-8 py-3">
          Retake Test
        </button>
        <Link href="/" className="px-8 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors text-sm font-medium">
          ← Home
        </Link>
      </div>
    </div>
  );
}
