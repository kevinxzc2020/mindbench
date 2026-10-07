"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { GAMES, formatScore, type GameId } from "@/lib/utils";
import { readAttempts, recordAttempt, type Attempt } from "@/lib/progress";
import type { Difficulty } from "@/lib/difficulty";
const COPY = {
  en: { history: "Your recent attempts", best: "Personal best", note: "This browser only · same difficulty and device class. Submitted scores are not independently verified. This is not a medical assessment.", latency: "Display, mouse and browser latency can affect timing results.", share: "Share result", copied: "Result copied", failed: "Sharing unavailable. Select and copy your score above.", unavailable: "Browser storage unavailable; this attempt was not stored.", daily: "Daily challenge", retry: "Try again" },
  zh: { history: "最近的尝试", best: "个人最佳", note: "仅保存在本浏览器 · 同难度、同设备类型。提交成绩未经独立验证；本测试不是医学评估。", latency: "屏幕、鼠标和浏览器延迟会影响计时成绩。", share: "分享成绩", copied: "成绩已复制", failed: "分享不可用，请选择并复制上方成绩。", unavailable: "浏览器存储不可用，本次成绩未保存。", daily: "每日挑战", retry: "再试一次" },
  es: { history: "Intentos recientes", best: "Mejor marca personal", note: "Solo este navegador · misma dificultad y tipo de dispositivo. Resultados no verificados independientemente. No es una evaluación médica.", latency: "La pantalla, el ratón y el navegador pueden afectar los tiempos.", share: "Compartir resultado", copied: "Resultado copiado", failed: "No se puede compartir. Copia tu resultado.", unavailable: "Almacenamiento no disponible; intento no guardado.", daily: "Desafío diario", retry: "Reintentar" },
};
export function ResultProgress({ gameId, value, difficulty, storageFailed, onRetry }: { gameId: GameId; value: number; difficulty: Difficulty; storageFailed: boolean; onRetry: () => void }) {
  const { lang, t } = useLang(); const copy = COPY[lang];
  const game = GAMES.find((g) => g.id === gameId)!;
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const device = matchMedia("(pointer: coarse)").matches ? "touch" : "pointer";
    setAttempts(readAttempts().filter((a) => a.game === gameId && a.difficulty === difficulty && a.device === device));
  }, [gameId, difficulty, value]);
  const best = attempts.length ? (game.lowerIsBetter ? Math.min : Math.max)(...attempts.map((a) => a.value)) : value;
  async function share() {
    const text = `MindBench — ${t[game.titleKey]} (${difficulty}): ${formatScore(gameId, value, t)}`;
    const url = `${location.origin}/games/${gameId}`;
    try {
      if (navigator.share) await navigator.share({ title: "MindBench", text, url });
      else { await navigator.clipboard.writeText(`${text}\n${url}`); setMessage(copy.copied); }
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(copy.failed); }
  }
  return <section className="mt-6 text-left space-y-4">
    {storageFailed && <p role="alert">{copy.unavailable}</p>}
    <p>{copy.best}: <strong>{formatScore(gameId, best, t)}</strong></p>
    <h3>{copy.history}</h3>
    <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2">{attempts.slice(-10).map((a, i) => <li key={`${a.at}-${i}`} className="border border-white/15 p-3"><strong>{formatScore(gameId, a.value, t)}</strong><small className="block text-gray-400">{new Date(a.at).toLocaleDateString(lang)}</small></li>)}</ol>
    <p className="text-xs text-gray-400">{copy.note} {game.lowerIsBetter && copy.latency}</p>
    <div className="flex flex-wrap gap-4"><button onClick={onRetry} className="btn-primary">{copy.retry}</button><button onClick={share} className="btn-secondary">{copy.share}</button><Link href="/daily" className="underline">{copy.daily}</Link></div>
    <p role="status">{message}</p>
  </section>;
}
export function saveLocalResult(game: GameId, difficulty: Difficulty, value: number) {
  return recordAttempt({ game, difficulty, value, at: new Date().toISOString(), device: matchMedia("(pointer: coarse)").matches ? "touch" : "pointer" });
}
