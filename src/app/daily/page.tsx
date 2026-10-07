"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/language-context";
const COPY = {
  en: { title: "One day. One memory challenge.", intro: "Same numbers for everyone, changing at midnight UTC. Practice retries are allowed; results stay on this browser, not the ranked leaderboard.", start: "Start / retry", remember: "Remember this number", answer: "Enter the number", submit: "Check", next: "Next round", end: "Challenge finished", correct: "Correct", score: "Rounds completed", share: "Copy challenge link", copied: "Link copied", failed: "Copy unavailable", history: "Your history" },
  zh: { title: "每天，一场共同的记忆挑战。", intro: "所有人使用相同数字，每天 UTC 零点换题。允许练习重试；成绩只保存在本浏览器，不进入竞技排行榜。", start: "开始 / 重试", remember: "记住这个数字", answer: "输入刚才的数字", submit: "核对", next: "下一轮", end: "挑战结束", correct: "正确", score: "完成轮数", share: "复制挑战链接", copied: "链接已复制", failed: "复制不可用", history: "我的记录" },
  es: { title: "Un día. Un desafío de memoria.", intro: "Los mismos números para todos. Cambia a medianoche UTC. Se permite practicar; resultados solo en este navegador, fuera de la clasificación.", start: "Empezar / reintentar", remember: "Recuerda este número", answer: "Escribe el número", submit: "Comprobar", next: "Siguiente", end: "Desafío terminado", correct: "Correcto", score: "Rondas completadas", share: "Copiar enlace", copied: "Enlace copiado", failed: "No se puede copiar", history: "Tu historial" },
};
function numberFor(day: string, round: number) {
  let seed = 2166136261;
  for (const char of `${day}/${round}`) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  let digits = "";
  for (let i = 0; i < round + 3; i++) { seed = Math.imul(seed, 1664525) + 1013904223 | 0; digits += String(i === 0 ? (seed >>> 0) % 9 + 1 : (seed >>> 0) % 10); }
  return digits;
}
export default function DailyPage() {
  const { lang } = useLang(); const c = COPY[lang];
  const [day, setDay] = useState(""); const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "correct" | "end">("idle");
  const [input, setInput] = useState(""); const [message, setMessage] = useState("");
  useEffect(() => { setDay(new Date().toISOString().slice(0, 10)); }, []);
  const target = numberFor(day, round);
  useEffect(() => { if (phase !== "show") return; const timer = setTimeout(() => setPhase("input"), target.length * 800); return () => clearTimeout(timer); }, [phase, target]);
  function finish(score: number) {
    setPhase("end");
    try { const key = `mindbench-daily-${day}`; const previous = Number(localStorage.getItem(key) ?? 0); localStorage.setItem(key, String(Math.max(previous, score))); } catch { /* Challenge remains playable without storage. */ }
  }
  return <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
    <p className="text-orange-400">MINDBENCH / DAILY / {day} UTC</p><h1 className="text-4xl font-bold">{c.title}</h1><p className="text-gray-400">{c.intro}</p>
    <section className="card p-8 text-center space-y-6">
      {phase === "idle" && <button disabled={!day} className="btn-primary" onClick={() => { setDay(new Date().toISOString().slice(0, 10)); setRound(0); setInput(""); setPhase("show"); }}>{c.start}</button>}
      {phase === "show" && <><p>{c.remember}</p><p className="font-mono font-bold text-4xl sm:text-6xl break-all">{target}</p></>}
      {phase === "input" && <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (input === target) { if (round === 9) finish(10); else setPhase("correct"); } else finish(round); }}><label htmlFor="daily-answer">{c.answer}</label><input id="daily-answer" autoFocus inputMode="numeric" autoComplete="off" className="input text-center" value={input} onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))} /><button disabled={!input} className="btn-primary">{c.submit}</button></form>}
      {phase === "correct" && <><p>{c.correct}</p><button className="btn-primary" onClick={() => { setRound(round + 1); setInput(""); setPhase("show"); }}>{c.next}</button></>}
      {phase === "end" && <><h2>{c.end}</h2><p>{c.score}: {input === target ? 10 : round}</p><button className="btn-primary" onClick={() => setPhase("idle")}>{c.start}</button></>}
    </section>
    <div className="flex gap-6"><button onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}/daily`); setMessage(c.copied); } catch { setMessage(c.failed); } }}>{c.share}</button><Link href="/progress">{c.history} ↗</Link></div><p role="status">{message}</p>
  </main>;
}
