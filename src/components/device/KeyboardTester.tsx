"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Maximize } from "lucide-react";
import { KeyComboTest } from "./KeyComboTest";
import { createKeyboardState, interruptKeyboard, keyDown, keyUp, type KeyboardPlatform } from "@/lib/device-diagnostics";
import { hasNumpad, KEYBOARD_LAYOUTS, keyboardRows, layoutCodes, navigationCluster, NUMPAD_KEYS, type KeyCap, type KeyboardLayout } from "@/lib/keyboard-layout";
import { Help, SessionControls, SessionReport, Stat, useDeviceText, useDiagnosticSession } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

export function KeyboardTester() {
  const { c, t } = useDeviceText();
  const session = useDiagnosticSession(createKeyboardState, interruptKeyboard);
  const [layout, setLayout] = useState<KeyboardLayout>("ansi");
  const [threshold, setThreshold] = useState(30);
  const [platform, setPlatform] = useState<KeyboardPlatform>({});
  const [locked, setLocked] = useState(false);
  const [lockNote, setLockNote] = useState("");
  useEffect(() => {
    const changed = () => { if (document.fullscreenElement !== session.surface.current) { (navigator as Navigator & { keyboard?: { unlock?: () => void } }).keyboard?.unlock?.(); setLocked(false); } };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, [session.surface]);
  const enterLocked = async () => {
    const el = session.surface.current; if (!el) return;
    try { await el.requestFullscreen(); } catch { setLockNote(t("Fullscreen is unavailable here.", "此环境无法进入全屏。", "Pantalla completa no disponible.")); return; }
    const keyboard = (navigator as Navigator & { keyboard?: { lock?: () => Promise<void> } }).keyboard;
    try { if (!keyboard?.lock) throw new Error("unsupported"); await keyboard.lock(); setLocked(true); setLockNote(t("System keys locked. Esc, Win/⌘ and similar keys are captured. Hold Esc to leave fullscreen.", "已锁定系统键：Esc、Win/⌘ 等键会被检测捕获。长按 Esc 退出全屏。", "Teclas del sistema bloqueadas. Mantén Esc para salir de pantalla completa.")); }
    catch { setLocked(false); setLockNote(t("This browser cannot lock system keys (Chrome and Edge can). Fullscreen still works; Esc leaves it.", "此浏览器不支持锁定系统键（Chrome、Edge 支持）。全屏仍可用，按 Esc 退出。", "Este navegador no bloquea teclas del sistema (Chrome y Edge sí). Esc sale de pantalla completa.")); }
    session.start();
  };
  useEffect(() => { setPlatform({ metaSuppressesKeyup: /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) }); }, []);
  const s = session.state.current;
  const codes = layoutCodes(layout);
  const seen = codes.filter(code => s.keys[code]?.presses > 0);
  const missing = codes.filter(code => !s.keys[code]?.presses);
  const extra = Object.keys(s.keys).filter(code => !codes.includes(code));
  useEffect(() => {
    const up = (e: KeyboardEvent) => { if (!session.listening.current || !e.isTrusted) return; keyUp(session.state.current, e.code || `Unidentified-${e.location}`, session.clock(), platform); session.refresh(); };
    window.addEventListener("keyup", up);
    return () => window.removeEventListener("keyup", up);
  }, [platform, session.listening, session.state, session.clock, session.refresh]);
  const cap = (k: KeyCap, placement?: CSSProperties) => {
    const result = s.keys[k.code];
    const state = result?.heldSince != null ? "held" : result?.suspects ? "review" : result?.presses ? "received" : "notTested";
    return <div key={k.code} className={`${styles.key} ${styles[state]}`} style={{ flex: `${k.width ?? 1} 0 0`, ...placement }} title={`${k.code} · ${c(state)}`} aria-label={`${k.code}: ${c(state)}`}><span>{k.label}</span>{result?.presses ? <small>{result.presses}</small> : null}</div>;
  };
  return <>
    <ol className={styles.steps}><li>{t("Start the test, then press and release each physical key.", "开始检测后，依次按下并松开实体键盘的每个按键。", "Inicia la prueba y pulsa y suelta cada tecla física.")}</li><li>{t("Hold a key to inspect normal auto-repeat; hold several keys to test combinations.", "长按查看正常自动重复；同时按住多个键检查组合响应。", "Mantén una tecla para ver la repetición; pulsa varias para probar combinaciones.")}</li><li>{t("For chatter checks, tap a single key slowly and compare physical presses with the recorded count.", "检查异常连击时，请缓慢单次按键，对照实际按压次数与记录次数。", "Para revisar rebotes, pulsa despacio y compara tus pulsaciones con el contador.")}</li></ol>
    <div className={styles.settings}><label>{t("Keyboard layout", "键盘布局", "Distribución")}<select value={layout} disabled={session.active} onChange={e => setLayout(e.target.value as KeyboardLayout)}>{KEYBOARD_LAYOUTS.map(l=><option key={l.id} value={l.id}>{l.label}</option>)}</select></label><label>{t("Rapid re-press threshold", "重复按下提示阈值", "Umbral de pulsación rápida")}<select value={threshold} disabled={session.active} onChange={e => { setThreshold(Number(e.target.value)); session.reset(); }}>{[10,20,30,50,100,200].map(n=><option key={n} value={n}>{n} ms</option>)}</select></label><p>{c("settingHint")} {t("This is an adjustable review threshold, not a hardware fault standard.", "这是可调的复核提示阈值，不是硬件故障标准。", "Es un umbral de revisión ajustable, no una norma de fallo.")}</p></div>
    <SessionControls session={session}/>
    <div className={styles.controls}><button type="button" onClick={() => void enterLocked()}><Maximize size={16}/>{t("Fullscreen + lock system keys", "全屏并锁定系统键", "Pantalla completa y bloquear teclas")}</button>{lockNote && <span className={styles.caption}>{lockNote}</span>}</div>
    <div className={styles.stats}><Stat label={t("Layout coverage", "当前布局已收到", "Cobertura de distribución")} value={`${seen.length} / ${codes.length}`}/><Stat label={t("Presses", "按下次数", "Pulsaciones")} value={s.presses}/><Stat label={t("Auto-repeat", "长按自动重复", "Repetición automática")} value={s.repeats}/><Stat label={t("Most keys held together", "最多同时按住", "Máximo simultáneo")} value={s.maxChord}/><Stat label={c("suspects")} value={s.suspects} warning={s.suspects>0}/></div>
    <div ref={session.surface} tabIndex={0} role="region" aria-label={t("Keyboard test area", "键盘检测区域", "Área de prueba del teclado")} aria-describedby="keyboard-focus-help" className={`${styles.surface} ${styles.keyboardSurface} ${session.active ? styles.listening : ""}`}
      onBlur={e=>{ if (!e.currentTarget.contains(e.relatedTarget as Node | null)) session.pause("focus-lost"); }}
      onContextMenu={e=>{if(session.listening.current)e.preventDefault();}}
      onKeyDown={e=>{
        if (!session.listening.current || !e.nativeEvent.isTrusted) return;
        e.preventDefault();
        keyDown(session.state.current, e.code || `Unidentified-${e.location}`, e.repeat, session.clock(), threshold, platform); session.refresh();
        if (e.code === "Escape" && !locked) session.pause("escape", true);
      }}>
      <div className={styles.surfaceHead}><strong>{session.active ? t("Press your physical keys", "请按下实体按键", "Pulsa las teclas físicas") : t("Ready when you are", "点击开始，准备检测", "Listo para empezar")}</strong><span>{t("Reference layout · scroll sideways on a small screen", "参考布局 · 小屏可横向查看", "Distribución orientativa · desliza en pantallas pequeñas")}</span></div>
      <div className={styles.keyboardScroll}><div className={styles.keyboard}><div className={styles.mainKeys}>{keyboardRows(layout).map((row,i)=><div className={styles.keyRow} key={i}>{row.map(k=>cap(k))}</div>)}</div><div className={styles.extraKeys}>{navigationCluster(layout).length>0&&<div className={styles.navigationKeys}>{navigationCluster(layout).map(p=>cap(p.cap,{gridRow:p.row,gridColumn:p.column}))}</div>}{hasNumpad(layout) && <div className={styles.numpad}>{NUMPAD_KEYS.map((k,i)=>cap(k,i<4?{gridRow:2,gridColumn:i+1}:i<7?{gridRow:3,gridColumn:i-3}:i===7?{gridRow:"3 / span 2",gridColumn:4}:i<11?{gridRow:4,gridColumn:i-7}:i<14?{gridRow:5,gridColumn:i-10}:i===14?{gridRow:"5 / span 2",gridColumn:4}:i===15?{gridRow:6,gridColumn:"1 / span 2"}:{gridRow:6,gridColumn:3}))}</div>}</div></div></div>
      <div className={styles.legend}>{(["notTested","received","held","review"] as const).map(state=><span key={state}><i className={styles[state]}/>{c(state)}</span>)}</div>
      <div className={styles.keyReadout}><span>{c("held")}: <b>{s.held.join(" + ") || "—"}</b></span><span>{t("Last key", "最近按键", "Última tecla")}: <b>{s.last || "—"}</b></span></div>
      <KeyComboTest held={s.held} active={session.active} resetKey={s.logged===0?0:1}/>{extra.length>0 && <p className={styles.caption}>{t("Other keys received", "收到的其他按键", "Otras teclas recibidas")}: {extra.join(" · ")}</p>}
    </div>
    <p id="keyboard-focus-help" className={styles.caption}>{c("focus")} {t("Pausing clears held states without inventing release events; down/up counts can differ after a pause.","暂停会清除按住状态，不补记松开事件，因此暂停后按下/松开次数可能不相等。","Pausar limpia los estados pulsados sin inventar liberaciones; los contadores pueden diferir tras una pausa.")}</p>
    <SessionReport session={session} tool="keyboard" settings={{ layout, rapidRepressThresholdMs:threshold, thresholdIsHeuristic:true }} hasInput={s.presses>0}>
      <p>{s.presses === 0 ? c("noEvents") : s.suspects ? t("Review the marked keys. A rapid re-press or an unpaired event may also be caused by intentional input, software or lost events.", "请复测标记的按键。短间隔重复按下或事件不成对，也可能来自主动操作、软件或事件丢失。", "Revisa las teclas marcadas. Las pulsaciones rápidas o eventos sin pareja también pueden deberse al usuario, al software o a eventos perdidos.") : c("noSuspects")}</p>
      <details className={styles.details}><summary>{c("notTested")} · {missing.length}</summary><p>{missing.join(" · ") || t("All keys in this layout have sent a press event.", "当前布局的所有按键均已收到按下事件。", "Se recibió una pulsación de cada tecla de esta distribución.")}</p></details>
      {s.presses>0 && <div className={styles.tableScroll}><table><thead><tr><th>{t("Key", "按键", "Tecla")}</th><th>{t("Down / up", "按下 / 松开", "Pulsar / soltar")}</th><th>{t("Auto-repeat", "自动重复", "Repetición")}</th><th>{t("Last hold", "最近按住", "Última duración")}</th><th>{t("Shortest re-press gap", "最短重按间隔", "Intervalo mínimo")}</th></tr></thead><tbody>{Object.entries(s.keys).map(([code,k])=><tr key={code} className={k.suspects ? styles.suspectRow : undefined}><td>{code}</td><td>{k.presses} / {k.releases}</td><td>{k.repeats}</td><td>{k.lastHold === null ? "—" : `${k.lastHold.toFixed(1)} ms`}</td><td>{k.shortestGap === null ? "—" : `${k.shortestGap.toFixed(1)} ms`}</td></tr>)}</tbody></table></div>}
    </SessionReport>
    <Help><p>{t("The layout represents physical key codes, not your language-specific keycaps. On ISO keyboards the Enter shape is simplified. Fn and some OS shortcuts may never reach a webpage; an unreceived key is untested, not automatically broken.", "布局按物理按键代码显示，不代表你的语言键帽；ISO 回车外形经过简化。Fn 与部分系统快捷键可能不传给网页；未收到输入只能记为未验证，不能直接判为坏键。", "La distribución usa códigos físicos, no las leyendas de tu idioma; la forma de Intro ISO está simplificada. Fn y algunos atajos del sistema pueden no llegar a la web. Una tecla no recibida queda sin verificar, no se considera averiada.")}</p><p>{t("Combination testing only shows the keys received. It cannot certify N-key rollover or identify a hardware ghosting fault without comparing the keys you actually held. Start and pause are controls; clicking the illustrated keys does not count as a keyboard test.", "组合检测只显示收到的按键。需与实际按住的键对照，才能检查漏键，不能单凭网页认定全键无冲。点击键盘示意图不会计为实体按键通过。", "Las combinaciones muestran las teclas recibidas; compáralas con las que mantienes pulsadas. No certifican N-key rollover. Pulsar el dibujo no cuenta como probar una tecla física.")}</p></Help>
  </>;
}
