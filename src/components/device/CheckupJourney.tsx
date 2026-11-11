"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ClipboardList } from "lucide-react";
import type { ReportTool } from "@/lib/device-history";
import { trackJourney } from "@/lib/analytics";
import { CHECKUP_NEXT, checkupRecommendations } from "@/lib/checkup-recommendations";
import { CATALOG } from "@/lib/collections";
import { useLang } from "@/lib/language-context";
import { AdSenseBanner } from "../AdSenseBanner";
import styles from "./CheckupJourney.module.css";

const Journey = createContext({ connected: false, completed: false, begin: () => {}, reset: () => {}, finish: () => {} });
export const useCheckupJourney = () => useContext(Journey);

export function CheckupJourney({ tool, children }: { tool: ReportTool; children: ReactNode }) {
  const [completed, setCompleted] = useState(false);
  const started = useRef(false), finished = useRef(false), opened = useRef(false);
  useEffect(() => {
    const open = () => { if (!opened.current) opened.current = trackJourney({ name: "tool_open", tool }); };
    open(); window.addEventListener("mindbench-analytics-ready", open);
    return () => window.removeEventListener("mindbench-analytics-ready", open);
  }, [tool]);
  const begin = useCallback(() => {
    if (finished.current) { started.current = false; finished.current = false; setCompleted(false); }
    if (!started.current) { trackJourney({ name: "tool_start", tool }); started.current = true; }
  }, [tool]);
  const reset = useCallback(() => { started.current = false; finished.current = false; setCompleted(false); }, []);
  const finish = useCallback(() => {
    if (finished.current) return;
    begin(); finished.current = true; setCompleted(true); trackJourney({ name: "tool_complete", tool });
  }, [begin, tool]);
  return <Journey.Provider value={{ connected: true, completed, begin, reset, finish }}>{children}</Journey.Provider>;
}

const COPY = {
  en: { finish: "Finish check & see next steps", hint: "Review your observations above, then finish this check. You can save a local summary separately.", ready: "CHECK COMPLETE", title: "What would you like to do next?", body: "Your observations are ready to review. This does not certify that the hardware is fault-free.", history: "Checkup history", next: "Continue checking", driver: "Find official drivers", fun: "Ready for a break?", funBody: "Try a related skill or a small puzzle. These activities are separate from your device check.", test: "Ability test", game: "Mini-game", waiting: "Collect a sample or record an observation, then stop the check to continue." },
  zh: { finish: "完成检测，查看下一步", hint: "先复核上方的观察结果，再结束本轮检测。需要留档时，可单独保存本地摘要。", ready: "本轮检测已完成", title: "接下来，想做什么？", body: "可以回看你的观察结果；完成检测不等于硬件已通过无故障认证。", history: "查看自检记录", next: "继续排查", driver: "查找官方驱动", fun: "想换个轻松的挑战？", funBody: "试试相关能力，或者玩一局小拼图。这些活动独立于设备检测结果。", test: "能力测试", game: "小游戏", waiting: "请先采集数据或记录观察，并停止检测，再查看下一步。" },
  es: { finish: "Finalizar y ver siguientes pasos", hint: "Revisa tus observaciones antes de finalizar. Puedes guardar un resumen local por separado.", ready: "REVISIÓN FINALIZADA", title: "¿Qué quieres hacer ahora?", body: "Tus observaciones están listas. Finalizar no certifica que el equipo esté libre de fallos.", history: "Historial de revisiones", next: "Seguir comprobando", driver: "Buscar controladores oficiales", fun: "¿Un pequeño descanso?", funBody: "Prueba una habilidad o un pequeño puzle. Son actividades independientes de la revisión del dispositivo.", test: "Prueba de habilidad", game: "Minijuego", waiting: "Recoge datos o registra una observación y detén la revisión para continuar." },
};

export function CheckupCompletion({ tool, disabled }: { tool: ReportTool; disabled: boolean }) {
  const { lang } = useLang(); const c = COPY[lang];
  const { connected, completed, finish } = useCheckupJourney();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (completed && !disabled) heading.current?.focus({ preventScroll: true }); }, [completed, disabled]);
  if (!connected) return null;
  if (!completed || disabled) return <section className={styles.finish}><div><h2>{c.finish}</h2><p>{disabled ? c.waiting : c.hint}</p></div><button disabled={disabled} onClick={finish}><Check size={17}/>{c.finish}<ArrowRight size={17}/></button></section>;
  const next = CATALOG.devices.find(entry => entry.id === CHECKUP_NEXT[tool].next)!;
  const click = (target: string, kind: "tool" | "resource" | "test" | "game") => trackJourney({ name: "recommendation_click", tool, target, kind });
  return <section className={styles.result} aria-labelledby="checkup-next-title">
    <div className={styles.resultHead}><span><Check size={16}/>{c.ready}</span><h2 id="checkup-next-title" ref={heading} tabIndex={-1}>{c.title}</h2><p>{c.body}</p></div>
    <div className={styles.actions}><Link href={next.href!} onClick={() => click(next.id, "tool")}>{c.next}: {next.title[lang]}<ArrowRight size={16}/></Link><Link href="/tools/device-reports" onClick={() => click("device-reports", "tool")}><ClipboardList size={16}/>{c.history}</Link>{["mouse", "wheel", "keyboard", "environment"].includes(tool) && <Link href="/collections/drivers" onClick={() => click("drivers", "resource")}>{c.driver}<ArrowRight size={16}/></Link>}</div>
    <div className={styles.ad}><AdSenseBanner placement="result"/></div>
    <div className={styles.funHead}><h3>{c.fun}</h3><p>{c.funBody}</p></div>
    <div className={styles.cards}>{checkupRecommendations(tool).map(({ entry, kind }) => <Link key={entry.id} href={entry.href!} onClick={() => click(entry.id, kind)}>{entry.image && <div className={styles.image}><Image src={entry.image} alt="" fill sizes="(max-width: 600px) 95px, 240px"/></div>}<div className={styles.cardText}><span>{kind === "test" ? c.test : c.game}</span><h4>{entry.title[lang]}</h4><p>{entry.description[lang]}</p><ArrowRight size={16}/></div></Link>)}</div>
  </section>;
}
