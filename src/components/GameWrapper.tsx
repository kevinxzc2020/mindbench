"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { GAMES, formatScore, type GameId } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import {
  DIFFICULTIES,
  DIFFICULTY_COLORS,
  DIFFICULTY_ICONS,
  type Difficulty,
} from "@/lib/difficulty";
import { cn } from "@/lib/utils";

interface GameWrapperProps {
  gameId: GameId;
  // Children is rendered only after the user picks a difficulty.
  // Games read `difficulty` from the second arg to configure themselves.
  children: (
    onComplete: (score: number) => void,
    difficulty: Difficulty,
  ) => React.ReactNode;
  // If true, skip the difficulty picker and run the game directly with
  // difficulty = "medium". Used for games that don't have difficulty tiers
  // (e.g., cps-test is a pure speed test).
  noDifficulty?: boolean;
}

export function GameWrapper({ gameId, children, noDifficulty = false }: GameWrapperProps) {
  const { data: session } = useSession();
  const { t } = useLang();
  const game = GAMES.find((g) => g.id === gameId)!;

  // When noDifficulty is set, auto-pick "medium" so the game starts immediately.
  const [difficulty, setDifficulty] = useState<Difficulty | null>(
    noDifficulty ? "medium" : null
  );
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  // bumping this key forces the child game to remount on restart/difficulty change
  const [runKey, setRunKey] = useState(0);

  const handleComplete = async (score: number) => {
    setLatestScore(score);
    setSaved(false);
    setError("");

    if (!session || !difficulty) return;

    setSaving(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: gameId, value: score, difficulty }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        // Try to surface the real server error so we can diagnose
        let detail = "";
        try {
          const body = await res.json();
          detail = body?.error ? ` (${body.error})` : "";
        } catch {
          /* ignore JSON parse errors */
        }
        setError(`${t.saveFailed}${detail}`);
        console.error("[GameWrapper] save failed", res.status, detail);
      }
    } catch (err) {
      console.error("[GameWrapper] network error", err);
      setError(t.networkError);
    } finally {
      setSaving(false);
    }
  };

  const resetForNewRun = (d: Difficulty | null) => {
    // For noDifficulty games, we always stay on "medium" — never go null.
    setDifficulty(d === null && noDifficulty ? "medium" : d);
    setLatestScore(null);
    setSaved(false);
    setError("");
    setRunKey((k) => k + 1);
  };

  // Difficulty labels/descriptions
  const diffLabel: Record<Difficulty, string> = {
    easy: t.difficultyEasy,
    medium: t.difficultyMedium,
    hard: t.difficultyHard,
    hell: t.difficultyHell,
  };
  const diffDesc: Record<Difficulty, string> = {
    easy: t.difficultyEasyDesc,
    medium: t.difficultyMediumDesc,
    hard: t.difficultyHardDesc,
    hell: t.difficultyHellDesc,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Title */}
      <div className="mb-8 flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl shadow`}
        >
          {game.icon}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t[game.titleKey]}</h1>
          <p className="text-gray-400 text-sm">{t[game.descKey]}</p>
        </div>
        {/* Show current difficulty badge once picked (hidden for noDifficulty games) */}
        {difficulty && !noDifficulty && (
          <button
            onClick={() => resetForNewRun(null)}
            className={cn(
              "text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 text-white",
              "bg-gradient-to-br",
              DIFFICULTY_COLORS[difficulty],
              "hover:opacity-80 transition-opacity"
            )}
            title={t.difficultyChoose}
          >
            {DIFFICULTY_ICONS[difficulty]} {diffLabel[difficulty]}
          </button>
        )}
      </div>

      {/* Difficulty picker (shown until user picks; never for noDifficulty games) */}
      {!difficulty && !noDifficulty && (
        <div className="card p-8 space-y-5 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white">{t.difficultyChoose}</h2>
            <p className="text-sm text-gray-400">
              {t.difficulty} —{" "}
              <span className="text-gray-500">
                {/* only medium is the default */}
                ({t.difficultyMedium} = {t.difficultyMediumDesc})
              </span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => resetForNewRun(d)}
                className={cn(
                  "group relative rounded-xl p-5 text-left overflow-hidden border border-white/10 transition-all",
                  "bg-gradient-to-br hover:scale-[1.02] hover:shadow-lg",
                  DIFFICULTY_COLORS[d]
                )}
              >
                <div className="relative z-10 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{DIFFICULTY_ICONS[d]}</span>
                    <span className="text-lg font-black tracking-wider uppercase">
                      {diffLabel[d]}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 leading-snug">
                    {diffDesc[d]}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game area (only after difficulty picked) */}
      {difficulty && (
        <div key={runKey}>{children(handleComplete, difficulty)}</div>
      )}

      {/* Score feedback */}
      {latestScore !== null && difficulty && (
        <div className="mt-8 card p-6 text-center animate-fade-in">
          <p className="text-gray-400 text-sm mb-2">
            {t.thisScore}
            {!noDifficulty && (
              <span className="text-xs text-gray-500 ml-1">
                ({diffLabel[difficulty]})
              </span>
            )}
          </p>
          <p className="text-4xl font-extrabold text-brand-400">
            {formatScore(gameId, latestScore, t)}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            {saving && <span className="text-gray-400">{t.saving}</span>}
            {saved && (
              <span className="text-green-400 flex items-center gap-1">
                ✓ {t.scoreSaved}
              </span>
            )}
            {error && <span className="text-red-400">{error}</span>}
            {!session && !saving && (
              <span className="text-gray-400">
                <Link href="/login" className="text-brand-400 hover:underline">
                  {t.login}
                </Link>{" "}
                {t.loginToSave}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <Link
              href="/leaderboard"
              className="text-brand-400 hover:underline"
            >
              {t.viewLb}
            </Link>
            {!noDifficulty && (
              <>
                <span className="text-gray-700">·</span>
                <button
                  onClick={() => resetForNewRun(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t.difficultyChoose}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
