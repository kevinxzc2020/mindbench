"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Gauge, Ruler, Play, Square, RotateCcw } from "lucide-react";
import { dpiFromCounts, pollingSummary, type DistanceUnit, type PollingSummary } from "@/lib/mouse-measurements";
import { Stat, useDeviceText } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

type Panel = "polling" | "dpi";
export function MouseMeasurements() {
  const { t } = useDeviceText();
  const [panel, setPanel] = useState<Panel>("polling");
  return <section className={styles.graphPanel}>
    <div className={styles.sectionHead}><h2>{t("Mouse measurements", "鼠标参数估算", "Mediciones del ratón")}</h2><div className={styles.segmented}><button aria-pressed={panel === "polling"} onClick={() => setPanel("polling")}><Gauge size={14}/> {t("Polling rate", "回报率", "Frecuencia de sondeo")}</button><button aria-pressed={panel === "dpi"} onClick={() => setPanel("dpi")}><Ruler size={14}/> DPI</button></div></div>
    {panel === "polling" ? <PollingRate/> : <DpiMeasure/>}
  </section>;
}

type RawEvent = PointerEvent & { getCoalescedEvents?: () => PointerEvent[] };
function PollingRate() {
  const { t } = useDeviceText();
  const area = useRef<HTMLDivElement>(null);
  const times = useRef<number[]>([]);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<PollingSummary | null>(null);
  const [peak, setPeak] = useState<PollingSummary | null>(null);
  const [source, setSource] = useState("");
  useEffect(() => {
    const el = area.current; if (!el || !running) return;
    const raw = "onpointerrawupdate" in window;
    const type = raw ? "pointerrawupdate" : "pointermove";
    setSource(raw ? "pointerrawupdate" : "pointermove + coalesced");
    const handle = (event: Event) => {
      const e = event as RawEvent; if (!e.isTrusted || e.pointerType !== "mouse") return;
      const batch = e.getCoalescedEvents?.() ?? [];
      if (batch.length) for (const c of batch) times.current.push(c.timeStamp); else times.current.push(e.timeStamp);
      if (times.current.length > 20000) times.current.splice(0, times.current.length - 20000);
    };
    const tick = window.setInterval(() => {
      const now = performance.now();
      const summary = pollingSummary(times.current.filter(time => now - time < 1000));
      setCurrent(summary);
      if (summary) setPeak(best => !best || summary.medianHz > best.medianHz ? summary : best);
    }, 250);
    const stop = () => setRunning(false);
    el.addEventListener(type, handle); window.addEventListener("blur", stop);
    return () => { el.removeEventListener(type, handle); window.removeEventListener("blur", stop); clearInterval(tick); };
  }, [running]);
  const reset = () => { times.current = []; setCurrent(null); setPeak(null); };
  return <>
    <p className={styles.caption}>{t("Start, then move the mouse quickly in circles inside the box for a few seconds. The estimate uses the time between movement reports the browser receives.", "点击开始后，在框内快速画圈移动鼠标几秒钟。估算基于浏览器收到的移动报告之间的时间间隔。", "Inicia y mueve el ratón en círculos rápidos dentro del recuadro unos segundos. La estimación usa el tiempo entre informes de movimiento.")}</p>
    <div className={styles.controls}><button className={styles.primary} onClick={() => setRunning(v => !v)}>{running ? <Square size={15}/> : <Play size={15}/>} {running ? t("Stop", "停止", "Detener") : t("Start measuring", "开始测量", "Iniciar")}</button><button onClick={reset}><RotateCcw size={15}/>{t("Reset", "重置", "Reiniciar")}</button>{source && <span className={styles.caption}>{t("Event source", "事件来源", "Origen")}: {source}</span>}</div>
    <div ref={area} className={`${styles.measureArea} ${running ? styles.listening : ""}`}>{running ? t("Move the mouse quickly here", "在这里快速移动鼠标", "Mueve el ratón rápido aquí") : t("Press Start", "点击开始", "Pulsa Iniciar")}</div>
    <div className={styles.stats}>
      <Stat label={t("Current estimate", "当前估算", "Estimación actual")} value={current ? `${Math.round(current.medianHz)} Hz` : "—"}/>
      <Stat label={t("Highest estimate", "最高估算", "Estimación máxima")} value={peak ? `${Math.round(peak.medianHz)} Hz` : "—"}/>
      <Stat label={t("Closest standard rate", "最接近的标准回报率", "Frecuencia estándar más cercana")} value={peak ? `${peak.nearest} Hz` : "—"}/>
      <Stat label={t("Steady intervals", "间隔稳定度", "Intervalos estables")} value={current ? `${Math.round(current.steadyShare * 100)}%` : "—"} warning={!!current && current.steadyShare < 0.6}/>
    </div>
    <p className={styles.caption}>{t("Browsers may merge or cap movement reports, so results above 1000 Hz are often under-read; Chrome and Edge report the most detail. Wireless power saving and USB hubs can also lower it. Treat this as an estimate.", "浏览器可能合并或限制移动报告，1000 Hz 以上常被低估；Chrome、Edge 提供的细节最多。无线省电模式和 USB 集线器也可能拉低结果。结果仅供参考。", "Los navegadores pueden agrupar o limitar los informes; por encima de 1000 Hz suele subestimarse. Chrome y Edge dan más detalle. Es una estimación.")}</p>
  </>;
}

type LockableDiv = HTMLDivElement & { requestPointerLock: (options?: { unadjustedMovement?: boolean }) => Promise<void> | void };
function DpiMeasure() {
  const { t } = useDeviceText();
  const area = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(10);
  const [unit, setUnit] = useState<DistanceUnit>("cm");
  const [locked, setLocked] = useState(false);
  const [raw, setRaw] = useState<boolean | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [live, setLive] = useState(0);
  const [trials, setTrials] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const sum = useRef({ x: 0, active: false });
  const finish = useCallback(() => { if (document.pointerLockElement) document.exitPointerLock(); }, []);
  useEffect(() => {
    const change = () => { const on = document.pointerLockElement === area.current; setLocked(on); if (!on) { sum.current.active = false; setMeasuring(false); } };
    const down = (e: MouseEvent) => { if (document.pointerLockElement !== area.current || e.button !== 0) return; sum.current = { x: 0, active: true }; setLive(0); setMeasuring(true); };
    const move = (e: MouseEvent) => { if (!sum.current.active) return; sum.current.x += e.movementX; setLive(sum.current.x); };
    const up = (e: MouseEvent) => {
      if (!sum.current.active || e.button !== 0) return;
      sum.current.active = false; setMeasuring(false);
      const counts = Math.abs(sum.current.x);
      if (counts > 0) setTrials(list => [...list.slice(-9), counts]);
      finish();
    };
    document.addEventListener("pointerlockchange", change); document.addEventListener("mousedown", down); document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
    return () => { document.removeEventListener("pointerlockchange", change); document.removeEventListener("mousedown", down); document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, [finish]);
  const lock = async () => {
    const el = area.current as LockableDiv | null; if (!el) return;
    setMessage("");
    try { await el.requestPointerLock({ unadjustedMovement: true }); setRaw(true); }
    catch {
      try { await el.requestPointerLock(); setRaw(false); }
      catch { setMessage(t("Pointer lock was refused. Click the box once and try again.", "浏览器拒绝了指针锁定。先点一下框内，再重试。", "Se rechazó el bloqueo del puntero. Haz clic en el recuadro e inténtalo de nuevo.")); }
    }
  };
  const dpis = trials.map(c => dpiFromCounts(c, distance, unit)).filter((v): v is number => v !== null);
  const average = dpis.length ? dpis.reduce((a, b) => a + b, 0) / dpis.length : null;
  return <>
    <ol className={styles.steps}>
      <li>{t("Put a ruler on your desk and set the distance you will move.", "在桌面上放一把尺子，设置要移动的距离。", "Coloca una regla y define la distancia.")}</li>
      <li>{t("Press Start: the pointer is hidden. Hold the left button at the ruler's start, move straight to the right by exactly that distance, then release.", "点击开始后指针会隐藏。在尺子起点按住左键，水平向右移动正好这段距离，然后松开。", "Pulsa Iniciar: el puntero se oculta. Mantén el botón izquierdo en el inicio, mueve a la derecha exactamente esa distancia y suelta.")}</li>
      <li>{t("Repeat 3 times and use the average.", "重复 3 次，取平均值。", "Repite 3 veces y usa la media.")}</li>
    </ol>
    <div className={styles.settings}>
      <label>{t("Distance", "移动距离", "Distancia")}<input type="number" min={1} max={100} step={0.5} value={distance} onChange={e => setDistance(Math.max(0, Number(e.target.value)))}/></label>
      <label>{t("Unit", "单位", "Unidad")}<select value={unit} onChange={e => setUnit(e.target.value as DistanceUnit)}><option value="cm">cm</option><option value="in">inch</option></select></label>
    </div>
    <div className={styles.controls}><button className={styles.primary} disabled={locked} onClick={() => void lock()}><Play size={15}/>{t("Start (hide pointer)", "开始（隐藏指针）", "Iniciar (ocultar puntero)")}</button><button disabled={!trials.length} onClick={() => setTrials([])}><RotateCcw size={15}/>{t("Clear", "清空", "Borrar")}</button>{message && <span className={styles.caption}>{message}</span>}</div>
    <div ref={area} className={`${styles.measureArea} ${locked ? styles.listening : ""}`}>{locked ? measuring ? `${t("Measuring", "测量中", "Midiendo")} · ${Math.abs(live)} counts` : t("Hold the left button and move right. Esc cancels.", "按住左键向右移动，Esc 取消。", "Mantén el botón izquierdo y mueve a la derecha. Esc cancela.") : t("The pointer is hidden only during a measurement", "仅在测量时隐藏指针", "El puntero solo se oculta al medir")}</div>
    <div className={styles.stats}>
      <Stat label={t("Average DPI", "平均 DPI", "DPI medio")} value={average ? Math.round(average) : "—"}/>
      <Stat label={t("Trials", "测量次数", "Intentos")} value={dpis.length}/>
      <Stat label={t("Each trial", "每次结果", "Cada intento")} value={dpis.length ? dpis.map(Math.round).join(" · ") : "—"}/>
      <Stat label={t("Raw input", "原始输入", "Entrada sin procesar")} value={raw === null ? "—" : raw ? t("Yes", "是", "Sí") : t("No", "否", "No")} warning={raw === false}/>
    </div>
    <p className={styles.caption}>{raw === false ? t("This browser could not bypass OS pointer acceleration, so the result may be inaccurate. Turn off Enhance pointer precision on Windows, or use Chrome or Edge.", "此浏览器无法绕过系统指针加速，结果可能不准。可关闭 Windows 的“提高指针精确度”，或改用 Chrome/Edge。", "El navegador no pudo evitar la aceleración del sistema; el resultado puede ser impreciso. Desactiva la precisión del puntero o usa Chrome/Edge.") : t("Uses raw movement counts where the browser allows it. Small hand drift and ruler error change the result by a few percent; compare with the DPI set in your mouse software.", "在浏览器允许时使用原始移动计数。手部偏移和尺子误差会带来几个百分点的偏差，可与鼠标驱动里设置的 DPI 对照。", "Usa conteos sin procesar si el navegador lo permite. Pequeñas desviaciones cambian el resultado unos puntos porcentuales; compáralo con tu software.")}</p>
  </>;
}
