"use client";
import { useEffect, useState } from "react";
import { readAttempts, type Attempt } from "@/lib/progress";
import { GAMES, formatScore } from "@/lib/utils";
import { useLang } from "@/lib/language-context";
import Link from "next/link";
export default function ProgressPage() {
  const { lang, t } = useLang(); const [attempts, setAttempts] = useState<Attempt[]>([]);
  useEffect(() => setAttempts(readAttempts().reverse()), []);
  const c = { en: ["Your progress", "Local history only. Clearing browser data removes these records. Account records remain separate.", "No attempts yet. Play a test to start your history.", "Daily challenge"], zh: ["你的进步记录", "这是本浏览器的记录，清除浏览器数据会删除。账号中的记录独立保存。", "还没有记录，完成一次测试后即可查看。", "每日挑战"], es: ["Tu progreso", "Historial local. Borrar los datos del navegador elimina estos registros. El historial de cuenta se guarda por separado.", "Sin intentos. Completa una prueba.", "Desafío diario"] }[lang];
  return <main className="max-w-4xl mx-auto px-4 py-12 space-y-6"><h1 className="text-4xl font-bold">{c[0]}</h1><p className="text-gray-400">{c[1]}</p><div className="flex gap-6"><Link href="/daily">{c[3]} ↗</Link><Link href="/stats">{lang === "zh" ? "账号统计" : lang === "es" ? "Estadísticas" : "Account statistics"} ↗</Link></div>{!attempts.length && <p>{c[2]}</p>}<ol className="space-y-3">{attempts.map((a, i) => { const game = GAMES.find((g) => g.id === a.game); if (!game) return null; return <li key={`${a.at}-${i}`} className="card p-4 flex flex-wrap gap-4 justify-between"><Link href={`/games/${game.id}`}>{t[game.titleKey]}</Link><strong>{formatScore(game.id, a.value, t)}</strong><span>{a.difficulty} / {a.device}</span><time dateTime={a.at}>{new Date(a.at).toLocaleString(lang)}</time></li>; })}</ol></main>;
}
