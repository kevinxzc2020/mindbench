"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Lock, Maximize, Minimize, Sparkles, TriangleAlert, X } from "lucide-react";
import { createKeyboardState, interruptKeyboard, keyDown, keyUp, type KeyboardPlatform } from "@/lib/device-diagnostics";
import { hasNumpad, inferLayout, KEYBOARD_LAYOUTS, languageFromMap, localKeyLabel, keyboardRows, layoutCodes, navigationCluster, NUMPAD_KEYS, type KeyCap, type KeyboardLayout, type LanguageLayout } from "@/lib/keyboard-layout";
import { Help, SessionControls, SessionReport, Stat, useDeviceText, useDiagnosticSession } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

type KeyboardLockApi = { lock?: (codes?: string[]) => Promise<void>; unlock?: () => void; getLayoutMap?: () => Promise<ReadonlyMap<string, string>> };
const LANGUAGE_NAMES: Record<LanguageLayout, [string, string, string]> = { qwerty: ["QWERTY", "QWERTY", "QWERTY"], azerty: ["AZERTY (French)", "AZERTY（法语）", "AZERTY (francés)"], qwertz: ["QWERTZ (German)", "QWERTZ（德语）", "QWERTZ (alemán)"] };
const systemKeyboard = () => (navigator as Navigator & { keyboard?: KeyboardLockApi }).keyboard;

export function KeyboardTester() {
  const { c, t } = useDeviceText();
  const session = useDiagnosticSession(createKeyboardState, interruptKeyboard);
  const [layout, setLayout] = useState<KeyboardLayout>("ansi");
  const [threshold, setThreshold] = useState(30);
  const [platform, setPlatform] = useState<KeyboardPlatform>({});
  const [locked, setLocked] = useState(false);
  const [lockNote, setLockNote] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [systemKeyHit, setSystemKeyHit] = useState(false);
  const [keyLabels, setKeyLabels] = useState<ReadonlyMap<string, string> | null>(null);
  const [language, setLanguage] = useState<LanguageLayout | null>(null);
  const [autoLayout, setAutoLayout] = useState(true);
  const [autoSwitch, setAutoSwitch] = useState<{ from: KeyboardLayout; to: KeyboardLayout } | null>(null);
  // Chrome/Edge tell which character each physical key types (language layout), not the keyboard model.
  useEffect(() => {
    systemKeyboard()?.getLayoutMap?.().then(map => { setKeyLabels(map); setLanguage(languageFromMap(map)); }).catch(() => {});
  }, []);
  // Browsers only let a page capture Win/⌘, Alt+Tab-style keys through the Keyboard Lock API, which works only in fullscreen.
  // Locking is opt-in; when used, fullscreen and the lock are released as soon as the test stops listening.
  useEffect(() => {
    if (session.active) return;
    systemKeyboard()?.unlock?.(); setLocked(false);
    if (document.fullscreenElement && document.fullscreenElement === session.surface.current) void document.exitFullscreen().catch(() => {});
  }, [session.active, session.surface]);
  const exitByButton = useRef(false);
  const escapeSeenAt = useRef(-Infinity);
  const keyOptions = useRef({ threshold, platform });
  keyOptions.current = { threshold, platform };
  useEffect(() => {
    // Leaving fullscreen (Esc or the exit button) only drops the lock; the test keeps listening in the page.
    const changed = () => {
      const inside = document.fullscreenElement === session.surface.current; setFullscreen(inside);
      if (!inside) {
        systemKeyboard()?.unlock?.(); setLocked(false);
        // The browser consumes the Esc press that leaves fullscreen, so the page usually never sees it. Count it here,
        // unless the exit button was used or the keydown did arrive.
        const viaButton = exitByButton.current; exitByButton.current = false;
        if (!viaButton && session.listening.current) {
          const state = session.state.current, now = session.clock(), { threshold, platform } = keyOptions.current;
          if (state.keys.Escape?.heldSince != null) keyUp(state, "Escape", now, platform);
          else if (performance.now() - escapeSeenAt.current > 500) { keyDown(state, "Escape", false, now, threshold, platform); keyUp(state, "Escape", now, platform); }
          session.refresh();
        }
        // Browsers restore the old scroll position on exit, often far from the test area; bring the in-page results back into view.
        const el = session.surface.current; if (!el) return;
        el.focus({ preventScroll: true });
        window.setTimeout(() => el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 120);
        setFlash(true); window.setTimeout(() => setFlash(false), 1400);
      }
    };
    document.addEventListener("fullscreenchange", changed);
    return () => { document.removeEventListener("fullscreenchange", changed); systemKeyboard()?.unlock?.(); };
  }, [session.surface, session.listening, session.state, session.clock, session.refresh]);
  // Win, PrtSc, Alt+Tab etc. can hand focus to the OS (Start menu, snipping tool) and pause the test.
  // Resume once the window is back, as long as the test area still holds focus.
  useEffect(() => {
    const back = () => { if (!session.listening.current && (session.reason === "focus-lost" || session.reason === "page-hidden") && document.activeElement === session.surface.current) session.start(); };
    window.addEventListener("focus", back);
    return () => window.removeEventListener("focus", back);
  }, [session.reason, session.listening, session.surface, session.start]);
  const startLocked = async () => {
    const el = session.surface.current; if (!el) return;
    try { if (document.fullscreenElement !== el) await el.requestFullscreen(); }
    catch { setLocked(false); setLockNote(t("Fullscreen is unavailable here, so system keys such as Win/⌘ may still reach the OS.", "此环境无法进入全屏，Win/⌘ 等系统键仍可能触发系统功能。", "Pantalla completa no disponible; teclas como Win/⌘ pueden llegar al sistema.")); session.start(); return; }
    const keyboard = systemKeyboard();
    try { if (!keyboard?.lock) throw new Error("unsupported"); await keyboard.lock(lockCodes); setLocked(true); setLockNote(""); }
    catch { setLocked(false); setLockNote(t("This browser cannot lock system keys (Chrome and Edge can), so Win/⌘ may still open system menus. Press Esc to leave fullscreen.", "此浏览器不支持锁定系统键（Chrome、Edge 支持），Win/⌘ 仍可能打开系统菜单。按 Esc 退出全屏。", "Este navegador no bloquea teclas del sistema (Chrome y Edge sí); Win/⌘ puede abrir menús. Pulsa Esc para salir de pantalla completa.")); }
    session.start();
  };
  useEffect(() => { setPlatform({ metaSuppressesKeyup: /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) }); }, []);
  const s = session.state.current;
  const codes = layoutCodes(layout);
  const seen = codes.filter(code => s.keys[code]?.presses > 0);
  const missing = codes.filter(code => !s.keys[code]?.presses);
  const extra = Object.keys(s.keys).filter(code => !codes.includes(code));
  const pressedKey = Object.keys(s.keys).join("|");
  // Follow the physical form the received keys prove (ISO key, numpad), unless the user undid a switch.
  useEffect(() => {
    if (!autoLayout || !pressedKey) return;
    const next = inferLayout(layout, pressedKey.split("|"));
    if (next) { setAutoSwitch(prev => ({ from: prev?.from ?? layout, to: next })); setLayout(next); }
  }, [autoLayout, pressedKey, layout]);
  // Esc stays unlocked so a single press leaves fullscreen (locking it would force a long press).
  const lockCodes = Array.from(new Set([...codes, "MetaLeft", "MetaRight", "ContextMenu"])).filter(code => code !== "Escape");
  useEffect(() => {
    const up = (e: KeyboardEvent) => { if (!session.listening.current || !e.isTrusted) return; e.preventDefault(); keyUp(session.state.current, e.code || `Unidentified-${e.location}`, session.clock(), platform); session.refresh(); };
    window.addEventListener("keyup", up);
    return () => window.removeEventListener("keyup", up);
  }, [platform, session.listening, session.state, session.clock, session.refresh]);
  // A visitor who simply starts typing should see a response: the first plain key press on a fresh page begins the test and
  // counts. Browser shortcuts, Tab, Esc, scroll keys and anything typed into a control are left alone.
  useEffect(() => {
    const NEVER = new Set(["Tab", "Escape", "F5", "F11", "F12", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"]);
    const first = (e: KeyboardEvent) => {
      if (!e.isTrusted || e.repeat || session.listening.current || session.startedAt.current !== null) return;
      if (e.ctrlKey || e.metaKey || e.altKey || NEVER.has(e.code)) return;
      if ((e.target as HTMLElement | null)?.closest?.("input, select, textarea, button, a, summary, [contenteditable]")) return;
      session.start();
      e.preventDefault();
      keyDown(session.state.current, e.code || `Unidentified-${e.location}`, false, session.clock(), keyOptions.current.threshold, keyOptions.current.platform);
      session.refresh();
    };
    window.addEventListener("keydown", first);
    return () => window.removeEventListener("keydown", first);
  }, [session.listening, session.startedAt, session.start, session.state, session.clock, session.refresh]);
  const cap = (k: KeyCap, placement?: CSSProperties) => {
    const result = s.keys[k.code];
    const state = result?.heldSince != null ? "held" : result?.suspects ? "review" : result?.presses ? "received" : "notTested";
    return <div key={k.code} className={`${styles.key} ${styles[state]}`} style={{ flex: `${k.width ?? 1} 0 0`, ...placement }} title={`${k.code} · ${c(state)}`} aria-label={`${k.code}: ${c(state)}`}><span>{localKeyLabel(k, keyLabels)}</span>{result?.presses ? <small>{result.presses}</small> : null}</div>;
  };
  return <>
    <ol className={styles.steps}><li>{t("Start the test, then press and release each physical key.", "开始检测后，依次按下并松开实体键盘的每个按键。", "Inicia la prueba y pulsa y suelta cada tecla física.")}</li><li>{t("Hold a key to inspect normal auto-repeat; hold several keys to test combinations.", "长按查看正常自动重复；同时按住多个键检查组合响应。", "Mantén una tecla para ver la repetición; pulsa varias para probar combinaciones.")}</li><li>{t("For chatter checks, tap a single key slowly and compare physical presses with the recorded count.", "检查异常连击时，请缓慢单次按键，对照实际按压次数与记录次数。", "Para revisar rebotes, pulsa despacio y compara tus pulsaciones con el contador.")}</li></ol>
    <div className={styles.layoutDetect}>
      <label className={styles.inlineSelect}>{t("Layout", "布局", "Distribución")}<select value={layout} disabled={session.active} onChange={e => { setLayout(e.target.value as KeyboardLayout); setAutoSwitch(null); }}>{KEYBOARD_LAYOUTS.map(l=><option key={l.id} value={l.id}>{l.label}</option>)}</select></label>
      <span><Sparkles size={14} aria-hidden/>{language ? <>{t("Detected language layout", "已检测到语言布局", "Distribución detectada")}: <b>{t(...LANGUAGE_NAMES[language])}</b></> : t("Language layout could not be read in this browser; keycaps show US labels.", "此浏览器无法读取语言布局，键帽按美式标注显示。", "No se pudo leer la distribución; se muestran etiquetas de EE. UU.")}</span>
      {autoSwitch ? <span className={styles.layoutSwitched}>{t("Auto-switched to", "已自动切换为", "Cambiado automáticamente a")} <b>{KEYBOARD_LAYOUTS.find(l => l.id === autoSwitch.to)?.label}</b><button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setLayout(autoSwitch.from); setAutoSwitch(null); setAutoLayout(false); }}>{t("Undo", "撤销", "Deshacer")}</button></span>
        : autoLayout && <span>{t("The layout follows the keys you press (ISO key, numpad).", "布局会根据你按下的键自动调整（ISO 键、小键盘）。", "La distribución se ajusta a las teclas que pulses (ISO, teclado numérico).")}</span>}
      <details className={styles.advanced}><summary>{t("Advanced", "高级设置", "Avanzado")}</summary><label className={styles.inlineSelect}>{t("Rapid re-press threshold", "重复按下提示阈值", "Umbral de pulsación rápida")}<select value={threshold} disabled={session.active} onChange={e => { setThreshold(Number(e.target.value)); session.reset(); }}>{[10,20,30,50,100,200].map(n=><option key={n} value={n}>{n} ms</option>)}</select></label><p>{c("settingHint")} {t("This is an adjustable review threshold, not a hardware fault standard.", "这是可调的复核提示阈值，不是硬件故障标准。", "Es un umbral de revisión ajustable, no una norma de fallo.")}</p></details>
    </div>
    <SessionControls session={session} hint={t("Press any key to begin", "按任意键开始", "Pulsa cualquier tecla para empezar")}/>
    <div ref={session.surface} tabIndex={0} role="region" aria-label={t("Keyboard test area", "键盘检测区域", "Área de prueba del teclado")} aria-describedby="keyboard-focus-help" className={`${styles.surface} ${styles.keyboardSurface} ${session.active ? styles.listening : ""} ${fullscreen ? styles.fullscreenMode : ""} ${flash ? styles.resultsFlash : ""}`}
      onClick={() => { if (!session.active) session.start(); }}
      onBlur={e=>{ if (!e.currentTarget.contains(e.relatedTarget as Node | null)) session.pause("focus-lost"); }}
      onContextMenu={e=>{if(session.listening.current)e.preventDefault();}}
      onKeyDown={e=>{
        if (!session.listening.current || !e.nativeEvent.isTrusted) return;
        e.preventDefault();
        if (e.code === "Escape" && !e.repeat) escapeSeenAt.current = performance.now();
        keyDown(session.state.current, e.code || `Unidentified-${e.location}`, e.repeat, session.clock(), threshold, platform); session.refresh();
        // Most people skim past the notice, so ask again right where they are looking once a system key actually escapes.
        if (!locked && (e.key === "Meta" || e.key === "OS" || /^(Meta|OS)(Left|Right)$/.test(e.code))) setSystemKeyHit(true);
      }}>
      {fullscreen && <div className={styles.fullscreenBar}>
        <span className={locked ? styles.fullscreenLocked : undefined}>{locked ? <Lock size={15} aria-hidden/> : <TriangleAlert size={15} aria-hidden/>}<b>{locked ? t("System keys locked", "系统键已锁定", "Teclas del sistema bloqueadas") : t("Fullscreen", "全屏模式", "Pantalla completa")}</b><em>{t("Press Esc to exit", "按 Esc 退出全屏", "Pulsa Esc para salir")}</em></span>
        <span className={styles.fullscreenStats}>{t("Coverage", "已收到", "Cobertura")} <b>{seen.length} / {codes.length}</b>{t("Presses", "按下", "Pulsaciones")} <b>{s.presses}</b></span>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { exitByButton.current = true; void document.exitFullscreen().catch(() => { exitByButton.current = false; }); }}><Minimize size={15}/>{t("Exit fullscreen", "退出全屏", "Salir")}</button>
      </div>}
      {systemKeyHit && !locked && <div className={styles.systemKeyPrompt} role="alert">
        <TriangleAlert size={20} aria-hidden/>
        <div><strong>{t("Did the Start menu pop up?", "开始菜单弹出来了？", "¿Se abrió el menú Inicio?")}</strong><span>{t("Lock system keys so Win/⌘ is only recorded.", "锁定系统键后，Win/⌘ 只会被记录。", "Bloquea las teclas del sistema para que Win/⌘ solo se registre.")}</span></div>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => void startLocked()}><Lock size={15}/>{t("Lock system keys", "锁定系统键", "Bloquear teclas")}</button>
        <button type="button" className={styles.promptClose} aria-label={t("Dismiss", "关闭", "Cerrar")} onMouseDown={e => e.preventDefault()} onClick={() => setSystemKeyHit(false)}><X size={16}/></button>
      </div>}
      <div className={styles.surfaceHead}><strong>{session.active ? t("Press your physical keys", "请按下实体按键", "Pulsa las teclas físicas") : t("Click here to start", "点击键盘区域开始检测", "Haz clic aquí para empezar")}</strong><span>{t("Reference layout · scroll sideways on a small screen", "参考布局 · 小屏可横向查看", "Distribución orientativa · desliza en pantallas pequeñas")}</span></div>
      <div className={styles.keyboardScroll}><div className={styles.keyboard}><div className={styles.mainKeys}>{keyboardRows(layout).map((row,i)=><div className={styles.keyRow} key={i}>{row.map(k=>cap(k))}</div>)}</div><div className={styles.extraKeys}>{navigationCluster(layout).length>0&&<div className={styles.navigationKeys}>{navigationCluster(layout).map(p=>cap(p.cap,{gridRow:p.row,gridColumn:p.column}))}</div>}{hasNumpad(layout) && <div className={styles.numpad}>{NUMPAD_KEYS.map((k,i)=>cap(k,i<4?{gridRow:2,gridColumn:i+1}:i<7?{gridRow:3,gridColumn:i-3}:i===7?{gridRow:"3 / span 2",gridColumn:4}:i<11?{gridRow:4,gridColumn:i-7}:i<14?{gridRow:5,gridColumn:i-10}:i===14?{gridRow:"5 / span 2",gridColumn:4}:i===15?{gridRow:6,gridColumn:"1 / span 2"}:{gridRow:6,gridColumn:3}))}</div>}</div></div></div>
      <div className={styles.legend}>{(["notTested","received","held","review"] as const).map(state=><span key={state}><i className={styles[state]}/>{c(state)}</span>)}</div>
      <div className={styles.keyReadout}><span>{c("held")}: <b>{s.held.join(" + ") || "—"}</b></span><span>{t("Last key", "最近按键", "Última tecla")}: <b>{s.last || "—"}</b></span></div>
      {extra.length>0 && <p className={styles.caption}>{t("Other keys received", "收到的其他按键", "Otras teclas recibidas")}: {extra.join(" · ")}</p>}
    </div>
    <p id="keyboard-focus-help" className={styles.caption}>{t("Clicking outside the test area pauses it. If Win, PrtSc or a window switch takes focus away, the test resumes when you come back. Esc is recorded like any other key, except in fullscreen where it exits fullscreen.", "点击检测区域外会暂停。按 Win、PrtSc 或切换窗口导致失去焦点时，回到页面后会自动继续。Esc 会像其他键一样被记录；全屏时按 Esc 则是退出全屏。", "Hacer clic fuera del área pausa la prueba. Si Win, ImprPant o un cambio de ventana quitan el foco, se reanuda al volver. Esc se registra como cualquier otra tecla, salvo en pantalla completa, donde sale de ella.")} {t("Pausing clears held states without inventing release events; down/up counts can differ after a pause.","暂停会清除按住状态，不补记松开事件，因此暂停后按下/松开次数可能不相等。","Pausar limpia los estados pulsados sin inventar liberaciones; los contadores pueden diferir tras una pausa.")}</p>
    <div className={`${styles.systemKeyNotice} ${locked ? styles.locked : ""}`} role="note">{locked ? <Lock size={18} aria-hidden/> : <TriangleAlert size={18} aria-hidden/>}<div><strong>{locked ? t("System keys locked", "系统键已锁定", "Teclas del sistema bloqueadas") : t("Win/⌘ will open the Start menu", "按 Win/⌘ 会弹出开始菜单", "Win/⌘ abrirá el menú Inicio")}</strong><p>{locked ? t("Win/⌘, Alt and similar keys are only recorded. Press Esc to leave fullscreen; the test keeps running.", "Win/⌘、Alt 等系统键只会被记录，不会触发系统功能。按 Esc 退出全屏，检测会继续。", "Win/⌘, Alt y similares solo se registran. Pulsa Esc para salir de pantalla completa; la prueba continúa.") : lockNote || t("Turn on fullscreen lock to test them without side effects.", "开启全屏锁定即可避免。", "Activa el bloqueo en pantalla completa para evitarlo.")}</p></div>{!locked && <button type="button" onClick={() => void startLocked()}><Maximize size={16}/>{t("Fullscreen + lock system keys", "全屏并锁定系统键", "Pantalla completa y bloquear teclas")}</button>}</div>
    <div className={styles.stats}><Stat label={t("Layout coverage", "当前布局已收到", "Cobertura de distribución")} value={`${seen.length} / ${codes.length}`}/><Stat label={t("Presses", "按下次数", "Pulsaciones")} value={s.presses}/><Stat label={t("Auto-repeat", "长按自动重复", "Repetición automática")} value={s.repeats}/><Stat label={t("Most keys held together", "最多同时按住", "Máximo simultáneo")} value={s.maxChord}/><Stat label={c("suspects")} value={s.suspects} warning={s.suspects>0}/></div>
    <SessionReport session={session} tool="keyboard" settings={{ layout, rapidRepressThresholdMs:threshold, thresholdIsHeuristic:true }} hasInput={s.presses>0}>
      <p>{s.presses === 0 ? c("noEvents") : s.suspects ? t("Review the marked keys. A rapid re-press or an unpaired event may also be caused by intentional input, software or lost events.", "请复测标记的按键。短间隔重复按下或事件不成对，也可能来自主动操作、软件或事件丢失。", "Revisa las teclas marcadas. Las pulsaciones rápidas o eventos sin pareja también pueden deberse al usuario, al software o a eventos perdidos.") : c("noSuspects")}</p>
      <details className={styles.details}><summary>{c("notTested")} · {missing.length}</summary><p>{missing.join(" · ") || t("All keys in this layout have sent a press event.", "当前布局的所有按键均已收到按下事件。", "Se recibió una pulsación de cada tecla de esta distribución.")}</p></details>
      {s.presses>0 && <div className={styles.tableScroll}><table><thead><tr><th>{t("Key", "按键", "Tecla")}</th><th>{t("Down / up", "按下 / 松开", "Pulsar / soltar")}</th><th>{t("Auto-repeat", "自动重复", "Repetición")}</th><th>{t("Last hold", "最近按住", "Última duración")}</th><th>{t("Shortest re-press gap", "最短重按间隔", "Intervalo mínimo")}</th></tr></thead><tbody>{Object.entries(s.keys).map(([code,k])=><tr key={code} className={k.suspects ? styles.suspectRow : undefined}><td>{code}</td><td>{k.presses} / {k.releases}</td><td>{k.repeats}</td><td>{k.lastHold === null ? "—" : `${k.lastHold.toFixed(1)} ms`}</td><td>{k.shortestGap === null ? "—" : `${k.shortestGap.toFixed(1)} ms`}</td></tr>)}</tbody></table></div>}
    </SessionReport>
    <Help><p>{t("The layout represents physical key codes, not your language-specific keycaps. On ISO keyboards the Enter shape is simplified. Fn and some OS shortcuts may never reach a webpage; an unreceived key is untested, not automatically broken.", "布局按物理按键代码显示，不代表你的语言键帽；ISO 回车外形经过简化。Fn 与部分系统快捷键可能不传给网页；未收到输入只能记为未验证，不能直接判为坏键。", "La distribución usa códigos físicos, no las leyendas de tu idioma; la forma de Intro ISO está simplificada. Fn y algunos atajos del sistema pueden no llegar a la web. Una tecla no recibida queda sin verificar, no se considera averiada.")}</p><p>{t("“Most keys held together” only counts keys the browser received at the same moment. Press a hand flat on the keys to see how many register; it cannot certify N-key rollover on its own. Clicking the illustrated keys does not count as a keyboard test.", "“最多同时按住”只统计浏览器在同一时刻收到的按键。想测无冲，可以用手掌同时压住一片键看能到几个；单凭网页不能认定全键无冲。点击键盘示意图不会计为实体按键通过。", "«Máximo simultáneo» solo cuenta teclas recibidas a la vez. Apoya la mano sobre varias teclas para ver cuántas registra; no certifica N-key rollover. Pulsar el dibujo no cuenta como probar una tecla física.")}</p></Help>
  </>;
}
