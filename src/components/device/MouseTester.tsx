"use client";

import { useEffect, useRef, useState } from "react";
import { appendLog, createMouseState, interruptMouse, mouseDown, mouseMove, mouseUp, type Point } from "@/lib/device-diagnostics";
import { Help, SessionControls, SessionReport, Stat, useDeviceText, useDiagnosticSession } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

export function MouseTester() {
  const { c, t } = useDeviceText();
  const session = useDiagnosticSession(createMouseState, interruptMouse);
  const [threshold, setThreshold] = useState(80);
  const [mode, setMode] = useState("buttons");
  const pointerKind = useRef("mouse");
  const s = session.state.current;
  const labels = [t("Primary", "主键（通常左键）", "Principal"),t("Middle", "中键", "Central"),t("Secondary", "副键（通常右键）", "Secundario"),t("Back", "后退侧键", "Atrás"),t("Forward", "前进侧键", "Adelante")];
  useEffect(() => {
    const el = session.surface.current; if (!el) return;
    const point = (e: MouseEvent): Point => { const r = el.getBoundingClientRect(); return { x:(e.clientX-r.left)/r.width*100, y:(e.clientY-r.top)/r.height*100 }; };
    const physicalMouse = (e: MouseEvent) => e.isTrusted && pointerKind.current === "mouse" && !(e as MouseEvent & {sourceCapabilities?: {firesTouchEvents?: boolean}}).sourceCapabilities?.firesTouchEvents;
    const down = (e: MouseEvent) => {
      if (!session.listening.current || !physicalMouse(e)) return;
      e.preventDefault(); mouseDown(session.state.current, e.button, session.clock(), threshold, point(e), mode === "drag"); session.refresh();
    };
    const up = (e: MouseEvent) => { if (!session.listening.current || !physicalMouse(e)) return; mouseUp(session.state.current, e.button, session.clock(), point(e)); session.refresh(); };
    const move = (e: MouseEvent) => {
      if (!session.listening.current || !physicalMouse(e)) return;
      const p = point(e);
      if (p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 || session.state.current.buttons.some(b => b.since !== null)) { mouseMove(session.state.current, e.buttons, p, session.clock()); session.refresh(); }
    };
    const dbl = (e: MouseEvent) => { if (!session.listening.current || !physicalMouse(e)) return; session.state.current.doubleClicks++; appendLog(session.state.current,{ at:session.clock(),event:"double-click",target:"primary",detail:"",kind:"notice" }); session.refresh(); };
    const suppress = (e: Event) => { if (session.listening.current) e.preventDefault(); };
    const leaveWindow = (e: MouseEvent) => { if (!e.relatedTarget) session.pause("window-left"); };
    el.addEventListener("mousedown",down); el.addEventListener("dblclick",dbl); el.addEventListener("contextmenu",suppress); el.addEventListener("auxclick",suppress);
    window.addEventListener("mouseup",up); window.addEventListener("mousemove",move); window.addEventListener("mouseout",leaveWindow);
    return () => { el.removeEventListener("mousedown",down); el.removeEventListener("dblclick",dbl); el.removeEventListener("contextmenu",suppress); el.removeEventListener("auxclick",suppress); window.removeEventListener("mouseup",up); window.removeEventListener("mousemove",move); window.removeEventListener("mouseout",leaveWindow); };
  },[mode, threshold, session.surface, session.state, session.listening, session.clock, session.refresh, session.pause]);
  const dragStatus = {
    idle:t("Hold the start target, drag across, then release on the end target.","按住起点，持续拖到终点，再松开主键。","Mantén el inicio, arrastra y suelta en el destino."),
    dragging:t("Keep holding. Release on the end target.","继续按住，到终点后再松开。","Sigue pulsando. Suelta en el destino."),
    complete:t("Completed · press the start target to repeat.","本次拖拽完成 · 可从起点再测一次。","Completado · vuelve al inicio para repetir."),
    "early-release":t("Released before the target. If this was unintentional, repeat the test.","到终点前已收到松开。如果并非你主动松手，请复测。","Se soltó antes del destino. Si no fue intencionado, repite."),
    interrupted:t("The drag was interrupted. Start again; focus loss is not a hardware failure.","拖拽已中断，请重新开始；焦点丢失不代表硬件故障。","Arrastre interrumpido. Repite; perder el foco no implica un fallo físico."),
  };
  return <>
    <ol className={styles.steps}><li>{t("Start, then click each mouse button inside the test area. Touch and pen input are excluded.","开始后，在检测区域内逐个点击鼠标按键；触摸和触控笔不计入鼠标结果。","Inicia y pulsa cada botón dentro del área. Se excluyen las entradas táctiles y de lápiz.")}</li><li>{t("To investigate unwanted double clicks, make slow, separate single clicks and compare the down/up counts.","排查异常双击时，请缓慢、分开地单击，对照按下与松开次数。","Para investigar dobles clics involuntarios, haz clics lentos separados y compara los contadores.")}</li><li>{t("Use drag mode to check holding continuity from the start target to the end target.","切换拖拽模式，从起点拖到终点，检查按住过程是否连续。","Usa el modo arrastre para comprobar la continuidad entre inicio y destino.")}</li></ol>
    <div className={styles.settings}><label>{t("Test mode","检测模式","Modo")}<select value={mode} disabled={session.active} onChange={e=>{setMode(e.target.value);session.reset();}}><option value="buttons">{t("Buttons & rapid clicks","按键与异常连点","Botones y clics rápidos")}</option><option value="drag">{t("Drag continuity","拖拽稳定性","Continuidad del arrastre")}</option></select></label><label>{t("Rapid pair threshold","快速连点提示阈值","Umbral de clics rápidos")}<select value={threshold} disabled={session.active} onChange={e=>{setThreshold(Number(e.target.value));session.reset();}}>{[30,50,80,100,150,200].map(n=><option key={n} value={n}>{n} ms</option>)}</select></label><p>{c("settingHint")} {t("A review threshold, not a hardware pass/fail limit.","阈值仅用于提示复核，不是硬件合格判据。","Es un umbral de revisión, no un límite de aprobación del hardware.")}</p></div>
    <SessionControls session={session}/>
    <div className={styles.stats}><Stat label={t("Button presses","按下次数","Pulsaciones")} value={s.buttons.reduce((n,b)=>n+b.downs,0)}/><Stat label={t("Buttons received","已收到按键种类","Botones recibidos")} value={`${s.buttons.filter(b=>b.downs>0).length} / 5`}/><Stat label={t("Rapid pairs to review","快速连点待复核","Pares rápidos a revisar")} value={s.rapid} warning={s.rapid>0}/><Stat label={t("Completed drags","完成拖拽","Arrastres completados")} value={`${s.dragCompleted} / ${s.dragAttempts}`}/></div>
    <div ref={session.surface} tabIndex={0} role="region" aria-label={t("Mouse test area","鼠标检测区域","Área de prueba del ratón")} aria-describedby="mouse-focus-help" className={`${styles.surface} ${styles.mouseSurface} ${session.active ? styles.listening : ""}`}
      onPointerDown={e=>{pointerKind.current=e.pointerType;}} onPointerMove={e=>{pointerKind.current=e.pointerType;}}
      onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))session.pause("focus-lost");}}
      onKeyDown={e=>{if(e.code==="Escape"&&session.active){e.preventDefault();session.pause("escape",true);}}}>
      <div className={styles.surfaceHead}><strong>{mode==="drag" ? t("Drag test","拖拽检测","Prueba de arrastre") : t("Click anywhere in this area","在此区域内点击鼠标","Haz clic en esta área")}</strong><span>{session.active ? c("active") : c("idle")}</span></div>
      {mode==="buttons" ? <div className={styles.mouseIllustration} aria-hidden="true"><div className={`${styles.mouseBody} ${s.buttons[0].since!==null ? styles.leftHeld : ""} ${s.buttons[2].since!==null ? styles.rightHeld : ""}`}><div className={styles.mouseLeft}>L</div><div className={styles.mouseRight}>R</div><div className={`${styles.mouseWheel} ${s.buttons[1].since!==null ? styles.activePart : ""}`}/><div className={styles.mouseSeam}/><span className={`${styles.sideButton} ${s.buttons[3].since!==null ? styles.activePart : ""}`}>4</span><span className={`${styles.sideButton} ${styles.sideForward} ${s.buttons[4].since!==null ? styles.activePart : ""}`}>5</span></div></div> : <div className={styles.dragLabels}><span>{t("START","起点","INICIO")}</span><span>{t("RELEASE HERE","在此松开","SUELTA AQUÍ")}</span></div>}
      <svg className={styles.trail} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{mode==="drag"&&<><ellipse cx="14" cy="50" rx="10" ry="10" className={styles.startTarget}/><ellipse cx="86" cy="50" rx="10" ry="10" className={styles.endTarget}/><line x1="25" x2="75" y1="50" y2="50" className={styles.guideLine}/></>}{s.trail.length>1&&<polyline points={s.trail.map(p=>`${Math.max(0,Math.min(100,p.x))},${Math.max(0,Math.min(100,p.y))}`).join(" ")} className={styles.trailLine}/>}</svg>
      <div className={styles.surfaceFoot}>{mode==="drag" ? dragStatus[s.drag] : t("Mouse only · primary, secondary, middle and two side buttons","仅统计鼠标 · 主键、副键、中键与两个侧键","Solo ratón · principal, secundario, central y dos laterales")}</div>
    </div>
    <p id="mouse-focus-help" className={styles.caption}>{c("focus")}</p>
    <div className={styles.buttonMeters}>{s.buttons.map((b,i)=><div key={i} className={b.since!==null ? styles.heldMeter : styles.buttonMeter}><span>{labels[i]}</span><strong>{b.downs}<small> / {b.ups}</small></strong><span>{t("down / up","按下 / 松开","pulsar / soltar")}</span></div>)}</div>
    <SessionReport session={session} tool="mouse" settings={{ mode, rapidClickThresholdMs:threshold, thresholdIsHeuristic:true }} hasInput={s.moves>0||s.buttons.some(b=>b.downs>0)}>
      <p>{!s.buttons.some(b=>b.downs>0) ? c("noEvents") : s.rapid || s.missingReleases ? t("Review the recorded rapid clicks and missing releases. Compare them with your intended actions before suspecting a switch problem.","请对照实际操作复核快速连点与缺失松开事件；确认不是主动操作后，再判断是否需要排查微动。","Revisa los clics rápidos y las liberaciones ausentes comparándolos con tus acciones antes de sospechar del interruptor.") : s.dragEarly>0 ? dragStatus["early-release"] : c("noSuspects")}</p>
      <div className={styles.miniStats}><span>{t("Browser double-click events","浏览器双击事件","Eventos de doble clic")}: {s.doubleClicks}</span><span>{t("Released before target","到终点前松开","Soltado antes del destino")}: {s.dragEarly}</span><span>{t("Release events missing","未收到松开事件","Liberaciones ausentes")}: {s.missingReleases}</span></div>
      <div className={styles.tableScroll}><table><thead><tr><th>{t("Button","按键","Botón")}</th><th>{t("Shortest click interval","最短点击间隔","Intervalo mínimo")}</th><th>{t("Last hold","最近按住","Última duración")}</th><th>{t("Rapid pairs","快速连点","Pares rápidos")}</th></tr></thead><tbody>{s.buttons.map((b,i)=><tr key={i}><td>{labels[i]}</td><td>{b.shortestInterval===null?"—":`${b.shortestInterval.toFixed(1)} ms`}</td><td>{b.lastHold===null?"—":`${b.lastHold.toFixed(1)} ms`}</td><td>{b.rapid}</td></tr>)}</tbody></table></div>
    </SessionReport>
    <Help><p>{t("Primary and secondary follow your OS button mapping; they may be swapped. Extra buttons mapped to shortcuts may not arrive as mouse buttons. Browser/OS navigation can still intercept some side buttons.","主键和副键遵循系统映射，左右可能互换。映射成快捷键的额外按键可能不作为鼠标按键传入；部分浏览器或系统仍可能截获侧键导航。","Principal y secundario siguen la asignación del sistema y pueden estar intercambiados. Los botones asignados a atajos pueden no llegar como botones; el sistema puede interceptar los laterales.")}</p><p>{t("Intentional double clicks and fast clicking also trigger rapid-pair observations. The browser's double-click event depends on system settings and is not proof of a defective switch. A drag released early may simply mean you let go early. Movement events are not a hardware polling-rate or DPI measurement.","主动双击和快速点击也会触发短间隔提示。浏览器双击事件受系统设置影响，不能据此确认微动损坏。提前松手也会导致拖拽未完成；移动事件数不代表硬件回报率或 DPI。","Los dobles clics intencionados también generan observaciones. El evento de doble clic depende del sistema y no demuestra un fallo. Soltar antes puede ser intencionado. Los eventos de movimiento no miden la frecuencia de sondeo ni los DPI.")}</p></Help>
  </>;
}
