"use client";

import { useEffect, useRef, useState } from "react";
import { appendLog, createMouseState, interruptMouse, mouseDown, mouseMove, mouseUp, type Point } from "@/lib/device-diagnostics";
import { Help, SessionControls, SessionReport, Stat, useDeviceText, useDiagnosticSession } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";
import { MouseMeasurements } from "./MouseMeasurements";

type MouseType = "basic" | "standard" | "mmo6" | "mmo12";
// MMO / side-number-pad mice (e.g. 12-button thumb grids) send their pad as keys 1–0, −, = or the numpad equivalents.
const PAD_DIGITS = ["Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9","Digit0","Minus","Equal"];
const PAD_NUMPAD = ["Numpad1","Numpad2","Numpad3","Numpad4","Numpad5","Numpad6","Numpad7","Numpad8","Numpad9","Numpad0","NumpadSubtract","NumpadAdd"];
const PAD_LABELS = ["1","2","3","4","5","6","7","8","9","0","−","="];
const padIndex = (code: string) => { const i = PAD_DIGITS.indexOf(code); return i >= 0 ? i : PAD_NUMPAD.indexOf(code); };
const padSize = (type: MouseType) => type === "mmo12" ? 12 : type === "mmo6" ? 6 : 0;

export function MouseTester() {
  const { c, t } = useDeviceText();
  const session = useDiagnosticSession(createMouseState, interruptMouse);
  const [threshold, setThreshold] = useState(80);
  const [mouseType, setMouseType] = useState<MouseType>("standard");
  const [autoType, setAutoType] = useState<MouseType | null>(null);
  const [padHeld, setPadHeld] = useState<number[]>([]);
  const buttonCount = mouseType === "basic" ? 3 : 5;
  const pad = padSize(mouseType);
  const pointerKind = useRef("mouse");
  const s = session.state.current;
  // Gaming/MMO mice send their extra buttons (side number pads, macro keys) as keyboard keys via the vendor driver,
  // and browsers report at most five mouse buttons. Record both kinds here so every button that reaches the page shows up.
  const [extras, setExtras] = useState<Record<string, number>>({});
  useEffect(() => { setExtras({}); }, [s]);
  const addExtra = (name: string) => setExtras(prev => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));
  const labels = [t("Primary", "主键（通常左键）", "Principal"),t("Middle", "中键", "Central"),t("Secondary", "副键（通常右键）", "Secundario"),t("Back", "后退侧键", "Atrás"),t("Forward", "前进侧键", "Adelante")];
  useEffect(() => {
    const el = session.surface.current; if (!el) return;
    const point = (e: MouseEvent): Point => { const r = el.getBoundingClientRect(); return { x:(e.clientX-r.left)/r.width*100, y:(e.clientY-r.top)/r.height*100 }; };
    const physicalMouse = (e: MouseEvent) => e.isTrusted && pointerKind.current === "mouse" && !(e as MouseEvent & {sourceCapabilities?: {firesTouchEvents?: boolean}}).sourceCapabilities?.firesTouchEvents;
    const down = (e: MouseEvent) => {
      if (!physicalMouse(e)) return;
      // Like the keyboard test: a click in the area starts (or resumes) the test, and that click already counts.
      if (!session.listening.current) session.start();
      e.preventDefault();
      if (e.button > 4) { addExtra(`${t("Mouse button","鼠标按键","Botón")} ${e.button + 1}`); return; }
      mouseDown(session.state.current, e.button, session.clock(), threshold, point(e), false); session.refresh();
    };
    const up = (e: MouseEvent) => { if (!session.listening.current || !physicalMouse(e)) return; mouseUp(session.state.current, e.button, session.clock(), point(e)); session.refresh(); };
    const move = (e: MouseEvent) => {
      if (!session.listening.current || !physicalMouse(e)) return;
      const p = point(e);
      if (p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 || session.state.current.buttons.some(b => b.since !== null)) { mouseMove(session.state.current, e.buttons, p, session.clock()); session.refresh(); }
    };
    const dbl = (e: MouseEvent) => { if (!session.listening.current || !physicalMouse(e)) return; session.state.current.doubleClicks++; appendLog(session.state.current,{ at:session.clock(),event:"double-click",target:"primary",detail:"",kind:"notice" }); session.refresh(); };
    const suppress = (e: Event) => { if (session.listening.current) e.preventDefault(); };
    // Side buttons (3 = back, 4 = forward) make the browser leave the page. Swallow them while the test is listening,
    // and also whenever the pointer is over the test area, so a stray press before Start cannot lose results.
    // preventDefault alone blocks the navigation. Never stopPropagation here: this runs in the window capture phase,
    // so stopping it would also hide the press from the test's own listeners and the side buttons would never register.
    const sideNav = (e: MouseEvent) => {
      if (e.button !== 3 && e.button !== 4) return;
      if (session.listening.current || el.contains(e.target as Node)) e.preventDefault();
    };
    const leaveWindow = (e: MouseEvent) => { if (!e.relatedTarget) session.pause("window-left"); };
    el.addEventListener("mousedown",down); el.addEventListener("dblclick",dbl); el.addEventListener("contextmenu",suppress); el.addEventListener("auxclick",suppress);
    for (const type of ["mousedown", "mouseup", "pointerdown", "pointerup", "auxclick"] as const) window.addEventListener(type, sideNav, true);
    window.addEventListener("mouseup",up); window.addEventListener("mousemove",move); window.addEventListener("mouseout",leaveWindow);
    return () => { el.removeEventListener("mousedown",down); el.removeEventListener("dblclick",dbl); el.removeEventListener("contextmenu",suppress); el.removeEventListener("auxclick",suppress); window.removeEventListener("mouseup",up); window.removeEventListener("mousemove",move); window.removeEventListener("mouseout",leaveWindow); for (const type of ["mousedown", "mouseup", "pointerdown", "pointerup", "auxclick"] as const) window.removeEventListener(type, sideNav, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[threshold, session.surface, session.state, session.listening, session.clock, session.refresh, session.pause, session.start]);
  const padSeen = new Set(Object.keys(extras).map(padIndex).filter(i => i >= 0));
  // A side pad proves itself: once two different pad keys arrive, show the pad (12 keys when any key past 6 arrives).
  useEffect(() => {
    if (padSeen.size < 2) return;
    const need: MouseType = Math.max(...Array.from(padSeen)) >= 6 ? "mmo12" : "mmo6";
    if (padSize(mouseType) < padSize(need)) { setMouseType(need); setAutoType(need); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [padSeen.size, mouseType]);
  const padReceived = Array.from(padSeen).filter(i => i < pad).length;
  const padState = (i: number) => padHeld.includes(i) ? styles.mPartHeld : padSeen.has(i) ? styles.mPartSeen : "";
  const typeNames: Record<MouseType, string> = {
    basic: t("Basic · left, right, wheel", "基础 · 左右键 + 滚轮", "Básico · izq., der., rueda"),
    standard: t("Standard · two side buttons", "标准 · 两个侧键", "Estándar · dos laterales"),
    mmo6: t("Side pad · 6 keys", "侧边 6 键", "Panel lateral · 6 teclas"),
    mmo12: t("MMO side pad · 12 keys", "MMO 侧边 12 键数字盘", "Panel MMO · 12 teclas"),
  };
  const part = (i: number) => s.buttons[i].since !== null ? styles.mPartHeld : s.buttons[i].downs > 0 ? styles.mPartSeen : "";
  return <>
    <ol className={styles.steps}><li>{t("Start, then click each mouse button inside the test area. Touch and pen input are excluded.","开始后，在检测区域内逐个点击鼠标按键；触摸和触控笔不计入鼠标结果。","Inicia y pulsa cada botón dentro del área. Se excluyen las entradas táctiles y de lápiz.")}</li><li>{t("To investigate unwanted double clicks, make slow, separate single clicks and compare the down/up counts.","排查异常双击时，请缓慢、分开地单击，对照按下与松开次数。","Para investigar dobles clics involuntarios, haz clics lentos separados y compara los contadores.")}</li></ol>
    <div className={styles.settings}><label>{t("Mouse type","鼠标类型","Tipo de ratón")}<select value={mouseType} onChange={e=>{setMouseType(e.target.value as MouseType);setAutoType(null);}}>{(Object.keys(typeNames) as MouseType[]).map(id=><option key={id} value={id}>{typeNames[id]}</option>)}</select></label><label>{t("Rapid pair threshold","快速连点提示阈值","Umbral de clics rápidos")}<select value={threshold} disabled={session.active} onChange={e=>{setThreshold(Number(e.target.value));session.reset();}}>{[30,50,80,100,150,200].map(n=><option key={n} value={n}>{n} ms</option>)}</select></label><p>{c("settingHint")} {t("A review threshold, not a hardware pass/fail limit.","阈值仅用于提示复核，不是硬件合格判据。","Es un umbral de revisión, no un límite de aprobación del hardware.")}</p></div>
    <SessionControls session={session}/>
    <div className={styles.stats}><Stat label={t("Button presses","按下次数","Pulsaciones")} value={s.buttons.reduce((n,b)=>n+b.downs,0)}/><Stat label={t("Buttons received","已收到按键种类","Botones recibidos")} value={`${s.buttons.filter((b,i)=>b.downs>0&&i<buttonCount).length + padReceived} / ${buttonCount + pad}`}/><Stat label={t("Rapid pairs to review","快速连点待复核","Pares rápidos a revisar")} value={s.rapid} warning={s.rapid>0}/></div>
    <div ref={session.surface} tabIndex={0} role="region" aria-label={t("Mouse test area","鼠标检测区域","Área de prueba del ratón")} aria-describedby="mouse-focus-help" className={`${styles.surface} ${styles.mouseSurface} ${session.active ? styles.listening : ""}`}
      onPointerDown={e=>{pointerKind.current=e.pointerType;}} onPointerMove={e=>{pointerKind.current=e.pointerType;}}
      onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))session.pause("focus-lost");}}
      onKeyDown={e=>{
        if(!session.active) return;
        if(e.code==="Escape"){e.preventDefault();session.pause("escape",true);return;}
        // Keys arriving while the mouse test listens usually come from mouse buttons mapped to keys (side number pad, macro keys).
        if(!e.nativeEvent.isTrusted||e.repeat) return;
        e.preventDefault(); addExtra(e.code||e.key);
        const i=padIndex(e.code); if(i>=0) setPadHeld(h=>h.includes(i)?h:[...h,i]);
      }}
      onKeyUp={e=>{const i=padIndex(e.code); if(i>=0){ if(session.active) e.preventDefault(); setPadHeld(h=>h.filter(x=>x!==i)); }}}>
      <div className={styles.surfaceHead}><strong>{t("Click anywhere in this area","在此区域内点击鼠标","Haz clic en esta área")}</strong><span>{session.active ? c("active") : c("idle")}</span></div>
      <MouseFigure state={part} sides={buttonCount>3 || s.buttons[3].downs>0 || s.buttons[4].downs>0} pad={pad} padState={padState} labels={{ back: t("Back","后退","Atrás"), forward: t("Forward","前进","Adelante") }}/>
      <div className={styles.surfaceFoot}>{pad ? t("Side pad keys arrive as number keys from the mouse driver","侧边数字盘由鼠标驱动以数字键形式发送","El panel lateral llega como teclas numéricas del controlador") : t("Mouse only · primary, secondary, middle and two side buttons","仅统计鼠标 · 主键、副键、中键与两个侧键","Solo ratón · principal, secundario, central y dos laterales")}</div>
    </div>
    <p id="mouse-focus-help" className={styles.caption}>{c("focus")}</p>
    <div className={styles.extraButtons}>
      <strong>{t("Extra buttons","其他按键","Botones extra")}</strong>
      {autoType && <span className={styles.extraSwitched}>{t("Side pad detected · switched to","检测到侧边数字盘 · 已切换为","Panel lateral detectado · cambiado a")} {typeNames[autoType]}</span>}
      {Object.keys(extras).length ? Object.entries(extras).filter(([name])=>!(padIndex(name)>=0&&padIndex(name)<pad)).map(([name,count])=><span key={name}>{name}<small>×{count}</small></span>)
        : <em>{t("Side number pads, macro and DPI-profile buttons: press them during the test. Ones mapped to keys show up here; buttons handled inside the mouse (DPI, profile) send nothing to the browser.","侧边数字键盘、宏按键等：检测中按下即可。映射成键盘按键的会显示在这里；DPI、配置切换这类由鼠标自己处理的按键不会发送给浏览器，无法检测。","Teclados laterales y botones macro: púlsalos durante la prueba. Los asignados a teclas aparecen aquí; DPI y perfiles se gestionan en el ratón y no llegan al navegador.")}</em>}
    </div>
    <div className={styles.buttonMeters}>{s.buttons.map((b,i)=>(i<buttonCount||b.downs>0)&&<div key={i} className={b.since!==null ? styles.heldMeter : styles.buttonMeter}><span>{labels[i]}</span><strong>{b.downs}<small> / {b.ups}</small></strong><span>{t("down / up","按下 / 松开","pulsar / soltar")}</span></div>)}</div>
    <SessionReport session={session} tool="mouse" settings={{ mouseType, buttonCount: buttonCount + pad, rapidClickThresholdMs:threshold, thresholdIsHeuristic:true }} hasInput={s.moves>0||s.buttons.some(b=>b.downs>0)}>
      <p>{!s.buttons.some(b=>b.downs>0) ? c("noEvents") : s.rapid || s.missingReleases ? t("Review the recorded rapid clicks and missing releases. Compare them with your intended actions before suspecting a switch problem.","请对照实际操作复核快速连点与缺失松开事件；确认不是主动操作后，再判断是否需要排查微动。","Revisa los clics rápidos y las liberaciones ausentes comparándolos con tus acciones antes de sospechar del interruptor.") : c("noSuspects")}</p>
      <div className={styles.miniStats}><span>{t("Browser double-click events","浏览器双击事件","Eventos de doble clic")}: {s.doubleClicks}</span><span>{t("Release events missing","未收到松开事件","Liberaciones ausentes")}: {s.missingReleases}</span></div>
      <div className={styles.tableScroll}><table><thead><tr><th>{t("Button","按键","Botón")}</th><th>{t("Shortest click interval","最短点击间隔","Intervalo mínimo")}</th><th>{t("Last hold","最近按住","Última duración")}</th><th>{t("Rapid pairs","快速连点","Pares rápidos")}</th></tr></thead><tbody>{s.buttons.map((b,i)=><tr key={i}><td>{labels[i]}</td><td>{b.shortestInterval===null?"—":`${b.shortestInterval.toFixed(1)} ms`}</td><td>{b.lastHold===null?"—":`${b.lastHold.toFixed(1)} ms`}</td><td>{b.rapid}</td></tr>)}</tbody></table></div>
    </SessionReport>
    <MouseMeasurements/>
    <Help><p>{t("Primary and secondary follow your OS button mapping; they may be swapped. Extra buttons mapped to shortcuts may not arrive as mouse buttons. Browser/OS navigation can still intercept some side buttons.","主键和副键遵循系统映射，左右可能互换。映射成快捷键的额外按键可能不作为鼠标按键传入；部分浏览器或系统仍可能截获侧键导航。","Principal y secundario siguen la asignación del sistema y pueden estar intercambiados. Los botones asignados a atajos pueden no llegar como botones; el sistema puede interceptar los laterales.")}</p><p>{t("Intentional double clicks and fast clicking also trigger rapid-pair observations. The browser's double-click event depends on system settings and is not proof of a defective switch. Movement events are not a hardware polling-rate or DPI measurement.","主动双击和快速点击也会触发短间隔提示。浏览器双击事件受系统设置影响，不能据此确认微动损坏。移动事件数不代表硬件回报率或 DPI。","Los dobles clics intencionados también generan observaciones. El evento de doble clic depende del sistema y no demuestra un fallo. Los eventos de movimiento no miden la frecuencia de sondeo ni los DPI.")}</p></Help>
  </>;
}

/** Top-down mouse: two button shells over a palm rest, a recessed wheel, and two thumb buttons. Held parts glow, received parts turn green. */
function MouseFigure({ state, sides, pad, padState, labels }: { state: (button: number) => string; sides: boolean; pad: number; padState: (i: number) => string; labels: { back: string; forward: string } }) {
  const rows = pad / 3, key = 16, gap = 3, padTop = pad === 12 ? 132 : 150;
  const body = "M100 18C146 18 170 52 170 112V196C170 252 140 286 100 286C60 286 30 252 30 196V112C30 52 54 18 100 18Z";
  return <div className={styles.mouseIllustration} aria-hidden="true">
    <svg className={styles.mouseFigure} viewBox="-34 0 268 300">
      <defs>
        <clipPath id="mouse-body"><path d={body}/></clipPath>
        <linearGradient id="mouse-shell" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="var(--m-shell-hi)"/><stop offset="1" stopColor="var(--m-shell-lo)"/></linearGradient>
      </defs>
      <path d={body} className={styles.mShell}/>
      <g clipPath="url(#mouse-body)">
        <rect x="26" y="12" width="72" height="112" rx="4" className={`${styles.mPart} ${state(0)}`}/>
        <rect x="102" y="12" width="72" height="112" rx="4" className={`${styles.mPart} ${state(2)}`}/>
      </g>
      <rect x="86" y="40" width="28" height="58" rx="14" className={styles.mWheelWell}/>
      <rect x="92" y="46" width="16" height="46" rx="8" className={`${styles.mWheel} ${state(1)}`}/>
      {[56, 63, 70, 77, 84].map(y => <line key={y} x1="95" x2="105" y1={y} y2={y} className={styles.mRidge}/>)}
      <text x="62" y="80" className={styles.mLabel}>L</text>
      <text x="138" y="80" className={styles.mLabel}>R</text>
      {pad > 0 && <g>
        <rect x={-4} y={padTop - 6} width={3 * key + 2 * gap + 12} height={rows * key + (rows - 1) * gap + 12} rx="10" className={styles.mPadPlate}/>
        {Array.from({ length: pad }, (_, i) => { const x = 2 + (i % 3) * (key + gap), y = padTop + Math.floor(i / 3) * (key + gap); return <g key={i}>
          <rect x={x} y={y} width={key} height={key} rx="4" className={`${styles.mPart} ${padState(i)}`}/>
          <text x={x + key / 2} y={y + key / 2 + 0.5} className={styles.mPadLabel}>{PAD_LABELS[i]}</text>
        </g>; })}
        {sides && <>
          <rect x="4" y={padTop - 34} width="22" height="12" rx="6" className={`${styles.mPart} ${state(3)}`}/>
          <rect x="30" y={padTop - 34} width="22" height="12" rx="6" className={`${styles.mPart} ${state(4)}`}/>
        </>}
      </g>}
      {sides && pad === 0 && <>
        <rect x="21" y="140" width="13" height="34" rx="6.5" className={`${styles.mPart} ${state(4)}`}/>
        <rect x="21" y="180" width="13" height="34" rx="6.5" className={`${styles.mPart} ${state(3)}`}/>
        <text x="13" y="161" className={styles.mSideLabel}>{labels.forward}</text>
        <text x="13" y="201" className={styles.mSideLabel}>{labels.back}</text>
      </>}
    </svg>
  </div>;
}
