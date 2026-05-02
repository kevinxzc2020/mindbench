"use client";

import { useState, useCallback, useRef } from "react";
import { GameWrapper } from "@/components/GameWrapper";
import { useLang } from "@/lib/language-context";
import type { Difficulty } from "@/lib/difficulty";
import { BookOpen, Heart, HeartCrack } from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────
const VM_CONFIG: Record<Difficulty, { lives: number; poolSize: number }> = {
  easy:   { lives: 5, poolSize: 300 },
  medium: { lives: 3, poolSize: 300 },
  hard:   { lives: 3, poolSize: 120 }, // smaller pool → words repeat sooner
  hell:   { lives: 2, poolSize: 70  },
};

// ── Word pool ────────────────────────────────────────────────────────────────
const WORD_POOL = [
  "apple","banana","carpet","driver","engine","forest","garden","harbor",
  "island","jungle","kitten","lemon","mirror","needle","orange","pepper",
  "rabbit","silver","timber","umbrella","violet","walnut","anchor","bridge",
  "candle","dancer","empire","finger","glider","helmet","insect","jacket",
  "kettle","lantern","muscle","napkin","oyster","planet","rocket","saddle",
  "turtle","vessel","window","bottle","castle","desert","falcon","goblin",
  "hunter","igloo","jewel","kernel","ladder","magnet","noodle","onion",
  "pillow","ridge","sphinx","throne","velvet","wheat","acorn","blaze",
  "coral","dagger","eagle","flame","gravel","holly","ivory","jelly",
  "maple","noble","otter","plumb","river","solar","tiger","ultra",
  "viper","adobe","birch","cedar","drill","ember","frost","gecko",
  "heron","joust","karma","llama","manor","nerve","prism","quirk",
  "radon","shore","tapir","vapor","xylem","yearn","zesty","abbot",
  "bluff","crisp","debut","elbow","fetch","grand","hatch","joker",
  "lotus","mimic","notch","rally","scout","talon","vigor","whisk",
  "album","brave","chess","draft","elite","flute","grove","inlet",
  "jumbo","knack","lofty","mango","oxide","proud","queen","raven",
  "stern","trout","vague","wrath","amber","beast","cliff","epoch",
  "frond","guava","hoist","irony","jaunt","kelp","linen","moose",
  "olive","plank","quota","smolt","taxon","venom","water","yucca",
  "agile","brisk","chunk","depot","flint","grind","input","knelt",
  "lunar","mirth","north","organ","remix","snare","thorn","volts",
  "aisle","blown","crimp","delta","event","floss","gruff","hinge",
  "image","jumpy","khaki","lyric","marsh","night","pouch","quilt",
  "roost","stomp","twine","vivid","waltz","abode","braid","civic",
  "downy","exert","frail","gusto","halve","icing","lapel","melon",
  "nymph","orbit","pleat","rowan","swamp","tepid","vying","weave",
  "botch","chimp","divot","eject","guile","hound","impel","jiffy",
  "koala","loyal","mocha","nudge","poker","rabbi","shawl","tibia",
  "vital","whelp","taunt","lunge","stash","brine","cleft","pixel",
  "oxide","gnome","trove","glyph","squab","tweed","wrung","oxide",
  "churn","plait","brood","fjord","smirk","troth","clout","frisk",
  "spunk","yelp","groan","dross","cinch","scalp","strop","clime",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "idle" | "playing" | "done";
type Feedback = "correct" | "wrong" | null;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VerbalMemoryPage() {
  return (
    <GameWrapper gameId="verbal-memory">
      {(onComplete, difficulty) => (
        <VerbalMemoryGame onComplete={onComplete} difficulty={difficulty} />
      )}
    </GameWrapper>
  );
}

// ── Game ──────────────────────────────────────────────────────────────────────
function VerbalMemoryGame({
  onComplete,
  difficulty,
}: {
  onComplete: (score: number) => void;
  difficulty: Difficulty;
}) {
  const { t } = useLang();
  const cfg = VM_CONFIG[difficulty];

  const [phase, setPhase]       = useState<Phase>("idle");
  const [score, setScore]       = useState(0);
  const [lives, setLives]       = useState(cfg.lives);
  const [word, setWord]         = useState("");
  const [isRepeat, setIsRepeat] = useState(false); // was this word shown before?
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [seenCount, setSeenCount] = useState(0);

  // Mutable game state — updated synchronously between turns
  const poolRef    = useRef<string[]>([]);
  const poolIdxRef = useRef(0);
  const seenRef    = useRef<Set<string>>(new Set()); // words shown in previous turns

  /** Pick the next word and determine if it's a repeat */
  const pickNext = useCallback((): { w: string; repeat: boolean } => {
    const seen    = seenRef.current;
    const pool    = poolRef.current;
    const idx     = poolIdxRef.current;
    const seenArr = Array.from(seen);

    // Once we've shown ≥1 word, 50% chance to re-show a seen one
    if (seenArr.length > 0 && Math.random() < 0.5) {
      const w = seenArr[Math.floor(Math.random() * seenArr.length)];
      return { w, repeat: true };
    }
    // Otherwise show the next unseen word from pool
    if (idx < pool.length) {
      poolIdxRef.current = idx + 1;
      return { w: pool[idx], repeat: false };
    }
    // Pool exhausted — only repeats possible
    const w = seenArr[Math.floor(Math.random() * seenArr.length)] ?? "word";
    return { w, repeat: true };
  }, []);

  const startGame = useCallback(() => {
    const pool = shuffle(WORD_POOL).slice(0, cfg.poolSize);
    poolRef.current   = pool;
    poolIdxRef.current = 1;
    seenRef.current   = new Set();

    const firstWord = pool[0];
    // First word is always "new" (never seen before)
    setWord(firstWord);
    setIsRepeat(false);
    setScore(0);
    setLives(cfg.lives);
    setFeedback(null);
    setSeenCount(0);
    setPhase("playing");
  }, [cfg]);

  const answer = useCallback(
    (choice: "seen" | "new") => {
      if (feedback !== null) return;

      const correct = (choice === "seen") === isRepeat;
      const fb: Feedback = correct ? "correct" : "wrong";
      setFeedback(fb);

      const newScore = correct ? score + 1 : score;
      const newLives = correct ? lives : lives - 1;

      setTimeout(() => {
        // Record current word as seen
        seenRef.current.add(word);
        const newSeenCount = seenRef.current.size;

        if (newLives <= 0) {
          setPhase("done");
          onComplete(newScore);
          return;
        }

        const { w, repeat } = pickNext();
        setScore(newScore);
        setLives(newLives);
        setWord(w);
        setIsRepeat(repeat);
        setFeedback(null);
        setSeenCount(newSeenCount);
      }, 600);
    },
    [feedback, isRepeat, score, lives, word, pickNext, onComplete]
  );

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="card p-8 space-y-6">
        <div className="text-center space-y-2">
          <BookOpen size={72} strokeWidth={1.8} className="mx-auto text-blue-400" />
          <h2 className="text-xl font-bold text-white">Verbal Memory</h2>
        </div>
        <div className="space-y-3 max-w-md mx-auto text-sm text-gray-300">
          {[
            "A word appears on screen.",
            "Press SEEN if you've seen it before this session, NEW if you haven't.",
            `You have ${cfg.lives} ${cfg.lives === 1 ? "life" : "lives"}. Each wrong answer costs one.`,
            "Words will repeat — remember every single one.",
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-blue-400 font-bold flex-shrink-0">{i + 1}.</span>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button className="btn-primary px-10 py-3" onClick={startGame}>
            {t.start}
          </button>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="card p-10 text-center space-y-5 animate-fade-in">
        <BookOpen size={56} strokeWidth={1.8} className="mx-auto text-blue-400" />
        <p className="text-7xl font-black text-blue-400 tabular-nums">{score}</p>
        <p className="text-sm text-gray-500">words remembered correctly</p>
        <button className="btn-primary px-10 py-3" onClick={startGame}>
          {t.restart}
        </button>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Lives + Score HUD */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: cfg.lives }).map((_, i) =>
            i < lives
              ? <Heart key={i} size={20} className="text-red-400 fill-red-400" />
              : <HeartCrack key={i} size={20} className="text-gray-700" />
          )}
        </div>
        <span className="text-2xl font-black text-blue-400 tabular-nums">{score}</span>
      </div>

      {/* Word card */}
      <div
        className={`card p-14 text-center select-none transition-colors duration-200 ${
          feedback === "correct" ? "border-green-500/60 bg-green-950/20" :
          feedback === "wrong"   ? "border-red-500/60   bg-red-950/20"   :
          "border-white/10"
        }`}
      >
        <p className="text-5xl font-black text-white tracking-wide">{word}</p>
        {feedback && (
          <p className={`mt-4 text-sm font-bold ${
            feedback === "correct" ? "text-green-400" : "text-red-400"
          }`}>
            {feedback === "correct" ? "✓ Correct" : `✗ Wrong — it was ${isRepeat ? "SEEN" : "NEW"}`}
          </p>
        )}
      </div>

      {/* SEEN / NEW buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => answer("seen")}
          disabled={feedback !== null}
          className="py-6 rounded-2xl font-black text-xl
                     bg-gradient-to-br from-blue-500 to-blue-700 text-white
                     hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100
                     shadow-lg shadow-blue-500/30 transition-all"
        >
          SEEN
        </button>
        <button
          onClick={() => answer("new")}
          disabled={feedback !== null}
          className="py-6 rounded-2xl font-black text-xl
                     bg-gradient-to-br from-slate-600 to-slate-800 text-white
                     border border-white/20 hover:scale-105 active:scale-95
                     disabled:opacity-40 disabled:scale-100 transition-all"
        >
          NEW
        </button>
      </div>

      <p className="text-center text-xs text-gray-600">
        {seenCount} unique {seenCount === 1 ? "word" : "words"} seen this session
      </p>
    </div>
  );
}
