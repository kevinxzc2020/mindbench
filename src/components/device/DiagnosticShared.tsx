"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Pause, Play, RotateCcw } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { csvLog, LOG_LIMIT, type SessionLog, type DiagnosticTool } from "@/lib/device-diagnostics";
import { COMMON, EVENT_NAMES, localText, toolText } from "./diagnostic-copy";
import styles from "./DeviceDiagnostics.module.css";

export function useDeviceText() {
  const { lang } = useLang();
  return { lang, t: (en: string, zh: string, es: string) => localText(lang, en, zh, es), c: (key: keyof typeof COMMON) => toolText(lang, COMMON[key]) };
}

export function useDiagnosticSession<T extends SessionLog>(factory: () => T, interrupt: (s: T, time: number, reason: string) => void) {
  const state = useRef<T>(factory());
  const surface = useRef<HTMLDivElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const listening = useRef(false);
  const origin = useRef<number | null>(null);
  const startedAt = useRef<string | null>(null);
  const frame = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [, render] = useState(0);
  const [reason, setReason] = useState("");
  const clock = useCallback(() => performance.now() - (origin.current ?? performance.now()), []);
  const refresh = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(() => { frame.current = null; render(n => n + 1); });
  }, []);
  const pause = useCallback((why = "manual", restoreFocus = false) => {
    if (!listening.current) return;
    listening.current = false; interrupt(state.current, clock(), why); setActive(false); setReason(why); refresh();
    if (restoreFocus) startButton.current?.focus();
  }, [clock, interrupt, refresh]);
  const start = useCallback(() => {
    if (origin.current === null) { origin.current = performance.now(); startedAt.current = new Date().toISOString(); }
    listening.current = true; setActive(true); setReason(""); surface.current?.focus({ preventScroll: true });
    surface.current?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);
  const reset = useCallback(() => {
    listening.current = false; setActive(false); setReason(""); state.current = factory(); origin.current = null; startedAt.current = null; refresh();
  }, [factory, refresh]);
  useEffect(() => {
    const blur = () => pause("focus-lost");
    const visibility = () => { if (document.hidden) pause("page-hidden"); };
    window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    return () => { listening.current = false; window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility); if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [pause]);
  return { state, surface, startButton, listening, active, reason, startedAt, clock, refresh, start, pause, reset };
}
export type Session<T extends SessionLog> = ReturnType<typeof useDiagnosticSession<T>>;

export function SessionControls<T extends SessionLog>({ session }: { session: Session<T> }) {
  const { c, t } = useDeviceText();
  return <div className={styles.controls}>
    <button ref={session.startButton} type="button" className={styles.primary} onPointerDown={e => { if (session.active) e.preventDefault(); }} onClick={() => session.active ? session.pause() : session.start()}>{session.active ? <Pause size={17}/> : <Play size={17}/>} {c(session.active ? "pause" : "start")}</button>
    <button type="button" onClick={session.reset}><RotateCcw size={16}/>{c("reset")}</button>
    <span role="status" className={session.active ? styles.live : styles.status}><i/>{c(session.active ? "active" : "idle")}{session.reason === "focus-lost" || session.reason === "page-hidden" ? ` · ${t("focus changed", "焦点已离开", "cambió el foco")}` : ""}</span>
  </div>;
}
export function Stat({ label, value, warning = false }: { label: string; value: ReactNode; warning?: boolean }) { return <div className={warning ? styles.warningStat : styles.stat}><span>{label}</span><strong>{value}</strong></div>; }
export function Help({ children }: { children: ReactNode }) { const { c } = useDeviceText(); return <aside className={styles.help}><h2>{c("limits")}</h2>{children}</aside>; }

function downloadFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SessionReport<T extends SessionLog>({ session, tool, settings, hasInput, children }: { session: Session<T>; tool: DiagnosticTool; settings: Record<string, unknown>; hasInput: boolean; children: ReactNode }) {
  const { lang, c, t } = useDeviceText();
  const [onlyReview, setOnlyReview] = useState(false);
  const s = session.state.current;
  const filtered = s.log.filter(e => !onlyReview || e.kind === "suspect");
  const visible = filtered.slice(-60).reverse();
  const fileName = () => `mindbench-${tool}-${new Date().toISOString().replace(/[:.]/g,"-")}`;
  const detailText = (event: string, detail: string) => {
    if(event==="keyup"||event==="mouseup") return detail.replace("held",t("held","按住","pulsado"));
    if(event==="paused") return detail==="manual"?t("Manually paused","手动暂停","Pausa manual"):detail==="escape"?t("Esc pressed","按 Esc 暂停","Pausa con Esc"):t("Focus or window changed; held inputs cleared","焦点或窗口改变，已清除按住状态","Cambió el foco o la ventana; se limpiaron los estados pulsados");
    if(event==="down-without-up") return t("No release received before another press","再次按下前未收到松开事件","No se recibió liberación antes de otra pulsación");
    if(event==="drag-early-release") return t("Released before the target; may be intentional","到终点前松开，也可能是主动操作","Liberación antes del destino; puede ser intencionada");
    if(event==="release-not-received") return t("No longer held, but release event was not received","已不再按住，但未收到松开事件","Ya no está pulsado, pero falta el evento de liberación");
    if(event==="zoom-ignored") return t("Ctrl / pinch-zoom input excluded","已排除 Ctrl / 捏合缩放输入","Entrada Ctrl / pellizco excluida");
    return detail||"—";
  };
  const exportReport = () => downloadFile(`${fileName()}.json`, JSON.stringify({ version: 1, tool, language: lang, startedAt: session.startedAt.current, exportedAt: new Date().toISOString(), settings, scope: "Browser events received only while this test was active. Observations are not hardware diagnoses. No input events are uploaded by this tool.", retainedEventLimit: LOG_LIMIT, omittedEvents: s.logged - s.log.length, data: s }, null, 2), "application/json");
  return <>
    <section className={styles.report}><div className={styles.sectionHead}><h2>{c("summary")}</h2><span>{s.interruptions} {c("interrupted")}</span></div>{children}
      <div className={styles.exports}><button disabled={session.active || !hasInput} onClick={exportReport}><Download size={15}/>{c("report")} · JSON</button><button disabled={session.active || !hasInput} onClick={() => downloadFile(`${fileName()}.csv`, csvLog(s.log), "text/csv;charset=utf-8")}><Download size={15}/>{c("csv")}</button></div><p className={styles.caption}>{c("exportHint")}</p>
    </section>
    <section className={styles.eventSection}><div className={styles.sectionHead}><h2>{c("events")}</h2><button aria-pressed={onlyReview} onClick={() => setOnlyReview(v => !v)}>{c(onlyReview ? "all" : "suspects")}</button></div>
      <p className={styles.caption}>{t("Showing the latest 60 matching events. Exports retain up to 5,000 events; totals include the entire session.", "显示最近 60 条匹配记录；导出最多保留 5,000 条事件，统计总数覆盖整轮检测。", "Se muestran los últimos 60 eventos coincidentes. La exportación conserva hasta 5.000; los totales cubren toda la sesión.")}{s.logged > LOG_LIMIT && ` ${t("Older events omitted:", "已省略较早事件：", "Eventos antiguos omitidos:")} ${s.logged - s.log.length}`}</p>
      {visible.length ? <div className={styles.tableScroll}><table><thead><tr><th>{c("time")} (ms)</th><th>{c("event")}</th><th>{c("target")}</th><th>{c("detail")}</th></tr></thead><tbody>{visible.map((e,i)=><tr key={`${s.logged}-${i}`} className={e.kind === "suspect" ? styles.suspectRow : undefined}><td>{e.at.toFixed(1)}</td><td>{EVENT_NAMES[e.event] ? toolText(lang, EVENT_NAMES[e.event]) : e.event}</td><td>{e.target}</td><td>{detailText(e.event,e.detail)}</td></tr>)}</tbody></table></div> : <p className={styles.empty}>{c(onlyReview ? "noSuspects" : "noEvents")}</p>}
    </section>
  </>;
}
