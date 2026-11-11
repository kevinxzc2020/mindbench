"use client";
import { useCheckupJourney } from "./CheckupJourney";

import { useCallback, useEffect, useRef, useState } from "react";
import { Gamepad2, Play, Square } from "lucide-react";
import { freshPadStats, observePad, summarizeRest, type PadStats, type RestSummary } from "@/lib/extended-diagnostics";
import { metric } from "@/lib/device-history";
import { useDeviceText } from "./DiagnosticShared";
import { SaveCheckup } from "./SaveCheckup";
import styles from "./ExtendedDiagnostics.module.css";

type Rumble = { playEffect: (type: string, params: { duration: number; startDelay: number; weakMagnitude: number; strongMagnitude: number }) => Promise<string>; reset?: () => Promise<string> };
type HapticPad = Gamepad & { vibrationActuator?: Rumble };
interface PadView { id: string; index: number; mapping: string; axes: number[]; buttons: { value: number; pressed: boolean; touched: boolean }[]; rumble: boolean }
const standardNames = ["A / Cross", "B / Circle", "X / Square", "Y / Triangle", "LB / L1", "RB / R1", "LT / L2", "RT / R2", "Back / Select", "Start", "LS / L3", "RS / R3", "D-pad ↑", "D-pad ↓", "D-pad ←", "D-pad →", "Home"];

export function GamepadTester() {
  const journey = useCheckupJourney();
  const { t } = useDeviceText(); const text = useRef(t); text.current = t;
  const running = useRef(false), frame = useRef(0), selected = useRef(-1), deviceKey = useRef(""), currentPad = useRef<HapticPad | null>(null);
  const stats = useRef<PadStats>(freshPadStats()), restStart = useRef<number | null>(null), restSamples = useRef<number[][]>([]);
  const [supported, setSupported] = useState<boolean | null>(null), [active, setActive] = useState(false), [pads, setPads] = useState<PadView[]>([]), [index, setIndex] = useState(-1), [pad, setPad] = useState<PadView | null>(null);
  const [rest, setRest] = useState<RestSummary | null>(null), [restRemaining, setRestRemaining] = useState<number | null>(null), [deadzone, setDeadzone] = useState(.1), [message, setMessage] = useState(""), [error, setError] = useState("");
  const [, redraw] = useState(0);
  const resetSample = useCallback(() => { stats.current = freshPadStats(); restStart.current = null; restSamples.current = []; setRest(null); setRestRemaining(null); redraw(n => n + 1); }, []);
  const stop = useCallback(() => {
    running.current = false; cancelAnimationFrame(frame.current); restStart.current = null; restSamples.current = []; setRestRemaining(null); setActive(false);
    stats.current.lastButtons = []; // The next sample must not inherit stale held buttons.
    try { void currentPad.current?.vibrationActuator?.reset?.().catch(() => {}); } catch { /* Vibration may already have ended. */ }
  }, []);
  useEffect(() => {
    setSupported(typeof navigator.getGamepads === "function" && window.isSecureContext);
    const hidden = () => { if (document.hidden) stop(); }; const escape = (e: KeyboardEvent) => { if (e.key === "Escape") stop(); };
    window.addEventListener("blur", stop); document.addEventListener("visibilitychange", hidden); window.addEventListener("keydown", escape);
    return () => { stop(); window.removeEventListener("blur", stop); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("keydown", escape); };
  }, [stop]);
  const start = () => {
    journey.begin();
    setError(""); setMessage(""); running.current = true; setActive(true); let lastRender = 0;
    const read = (now: number) => {
      if (!running.current) return;
      try {
        const connected = Array.from(navigator.getGamepads()).filter((p): p is Gamepad => !!p && p.connected) as HapticPad[];
        if (selected.current < 0 && connected.length) { selected.current = connected[0].index; setIndex(selected.current); }
        const raw = connected.find(p => p.index === selected.current) ?? null;
        const key = raw ? `${raw.index}:${raw.id}:${raw.mapping}:${raw.axes.length}:${raw.buttons.length}` : "";
        if (key !== deviceKey.current) {
          if (deviceKey.current && !raw) setMessage(text.current("Controller disconnected. Reconnect it or select another controller; the previous session has been cleared.", "手柄已断开，请重新连接或选择其他手柄；上一设备的采样已清除。", "Mando desconectado. Reconecta o elige otro; se borró la muestra anterior."));
          resetSample(); deviceKey.current = key;
        }
        currentPad.current = raw;
        if (raw) {
          observePad(stats.current, raw);
          if (restStart.current !== null) {
            restSamples.current.push(Array.from(raw.axes));
            if (now - restStart.current >= 3000) { setRest(summarizeRest(restSamples.current)); restStart.current = null; restSamples.current = []; setRestRemaining(null); }
          }
        }
        if (now - lastRender >= 80) {
          const views = connected.map(p => ({ id: p.id, index: p.index, mapping: p.mapping, axes: Array.from(p.axes), buttons: p.buttons.map(b => ({ value: b.value, pressed: b.pressed, touched: b.touched })), rumble: typeof p.vibrationActuator?.playEffect === "function" }));
          setPads(views); setPad(views.find(p => p.index === selected.current) ?? null); redraw(n => n + 1);
          if (restStart.current !== null) setRestRemaining(Math.max(0, 3 - (now - restStart.current) / 1000));
          lastRender = now;
        }
        frame.current = requestAnimationFrame(read);
      } catch { stop(); setError(text.current("This browser or page policy blocked controller access. Try a supported browser and check whether the page is embedded.", "浏览器或页面策略限制了手柄访问，请使用受支持浏览器，并检查是否处在嵌入页面。", "El navegador o la política de la página bloqueó el mando. Prueba un navegador compatible.")); }
    };
    frame.current = requestAnimationFrame(read);
  };
  const vibrate = async () => {
    try { const actuator = currentPad.current?.vibrationActuator; if (!actuator) throw new Error("unsupported"); const result = await actuator.playEffect("dual-rumble", { duration: 300, startDelay: 0, weakMagnitude: .3, strongMagnitude: .3 }); setMessage(result === "complete" ? t("The vibration command completed. Confirm by feel whether the controller vibrated.", "震动指令已完成，请通过手感确认是否实际震动。", "La orden terminó. Confirma físicamente si vibró.") : t("Vibration was interrupted or not completed.", "震动指令被打断或未完成。", "La vibración se interrumpió o no terminó.")); }
    catch { setMessage(t("Vibration is not available for this controller/browser combination.", "当前手柄与浏览器组合无法执行此震动测试。", "Esta combinación de mando y navegador no admite la vibración.")); }
  };
  const choose = (value: number) => { stop(); selected.current = value; setIndex(value); setPad(null); currentPad.current = null; deviceKey.current = ""; resetSample(); setMessage(""); };
  const s = stats.current;
  return <div className={styles.root}>
    <p className={styles.intro}>{t("Connect a controller by USB or Bluetooth, start listening, then press a controller button so the browser can expose it. Check every button, slowly rotate the sticks, and let them rest before a hands-off sample.", "通过 USB 或蓝牙连接手柄，开始接收后再按手柄按键，让浏览器识别。逐个按键、缓慢转动摇杆，静置后再采集回中样本。", "Conecta un mando por USB o Bluetooth, inicia y pulsa un botón para que el navegador lo detecte. Prueba los botones, gira las palancas y déjalas en reposo antes de medir.")}</p>
    {supported === false && <p className={styles.error}>{t("Gamepad access is not exposed in this browser/context.", "当前浏览器或运行环境未提供手柄访问。", "Este navegador o contexto no ofrece acceso a mandos.")}</p>}
    <div className={styles.controls}><button className={styles.primary} disabled={supported === false} onClick={() => active ? stop() : start()}>{active ? <Square size={16}/> : <Play size={16}/>} {active ? t("Stop listening", "停止接收", "Detener") : t("Start listening", "开始接收", "Iniciar")}</button><button onClick={() => { journey.reset(); resetSample(); setMessage(""); }}>{t("Reset session", "重置本轮", "Reiniciar")}</button><span className={styles.status}>{active ? t("Listening", "正在接收", "Escuchando") : t("Paused", "已暂停", "En pausa")}</span></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={styles.hint}>{message}</p>}
    <div className={styles.fields}><label>{t("Controller", "手柄设备", "Mando")}<select value={index} onChange={e => choose(Number(e.target.value))}><option value={-1}>{t("Detect first controller", "自动选择首个手柄", "Detectar primer mando")}</option>{pads.map(p => <option key={p.index} value={p.index}>#{p.index + 1} · {p.id}</option>)}</select></label><label>{t("Visual center reference radius", "中心参考圈半径", "Radio de referencia central")}<select value={deadzone} onChange={e => setDeadzone(Number(e.target.value))}>{[.05, .1, .15, .2].map(v => <option key={v} value={v}>{v.toFixed(2)}</option>)}</select></label></div>
    {!pad ? <div className={styles.empty}><Gamepad2 size={42} style={{ margin: "0 auto 16px" }}/>{t("No controller sample yet. Start listening and press a button on your controller. No device is not a failed hardware test.", "尚无手柄样本。开始接收后，请按一下手柄上的按键；未识别到设备不代表硬件损坏。", "Sin muestra de mando. Inicia y pulsa un botón del mando. No detectarlo no significa que esté averiado.")}</div> : <>
      <p className={styles.hint}>{pad.id} · {t("Mapping", "映射", "Mapeo")}: {pad.mapping || t("Browser-specific", "浏览器自定义", "Específico del navegador")} {pad.mapping !== "standard" && t("· Values are labelled by index; no Xbox/PlayStation layout is assumed.", "· 按索引显示，不假设 Xbox／PlayStation 布局。", "· Se muestran índices sin asumir una distribución.")}</p>
      <div className={styles.stats}><div><span>{t("Buttons observed", "已按过的按键", "Botones observados")}</span><strong>{s.pressed.filter(n => n > 0).length} / {pad.buttons.length}</strong></div><div><span>{t("Raw axes", "原始轴数", "Ejes originales")}</span><strong>{pad.axes.length}</strong></div><div><span>{t("Samples received", "收到的采样", "Muestras recibidas")}</span><strong>{s.samples}</strong></div></div>
      <section className={styles.panel}><h2>{t("Axis pairs", "轴对与摇杆位置", "Pares de ejes")}</h2><div className={styles.sticks}>{Array.from({ length: Math.ceil(pad.axes.length / 2) }, (_, pair) => { const x = pad.axes[pair * 2] ?? 0, y = pad.axes[pair * 2 + 1] ?? 0; return <svg className={styles.stick} key={pair} viewBox="0 0 200 215" role="img" aria-label={`Axes ${pair * 2} / ${pair * 2 + 1}: ${x.toFixed(3)}, ${y.toFixed(3)}`}><circle cx="100" cy="95" r="80" fill="#f4f5eb" stroke="#857b67"/><path d="M20 95H180M100 15V175" stroke="#bec8ac"/><circle cx="100" cy="95" r={deadzone * 80} fill="#bcc6a11a" stroke="#b9b99b" strokeDasharray="3 3"/><circle cx={100 + Math.max(-1, Math.min(1, x)) * 80} cy={95 + Math.max(-1, Math.min(1, y)) * 80} r="6" fill={active ? "#ff6748" : "#a39a85"}/><text x="100" y="203" fill="#596b45" textAnchor="middle" fontSize="10">{pair * 2}/{pair * 2 + 1}: {x.toFixed(3)}, {y.toFixed(3)}</text></svg>; })}</div><p className={styles.hint}>{t("The circle is a visual reference, not a hardware deadzone adjustment or a pass/fail threshold. Values remain raw. Unpaired axes use zero for the drawing's missing Y axis.", "参考圈仅辅助观察，不改变硬件死区，也不是合格阈值。数值保持原始值；单独一轴在示意图中使用 0 作为缺少的 Y 轴。", "El círculo es una referencia visual; no modifica la zona muerta ni decide si hay fallo. Los valores no se filtran. En ejes sin pareja se dibuja Y=0.")}</p></section>
      <section className={styles.panel}><h2>{t("Buttons & triggers", "按键与扳机", "Botones y gatillos")}</h2><div className={styles.buttons}>{pad.buttons.map((b, i) => <div key={i} className={styles.padButton} data-pressed={active && b.pressed}><strong>B{i} {pad.mapping === "standard" ? standardNames[i] ?? "" : ""}</strong><progress max={1} value={b.value} aria-label={`B${i} value`}/><small>{b.value.toFixed(3)} · {s.pressed[i] ?? 0} {t("presses", "次按下", "pulsaciones")}</small></div>)}</div></section>
      <section className={styles.panel}><h2>{t("Hands-off sample", "静置回中观察", "Muestra en reposo")}</h2><p className={styles.hint}>{t("Release all controls. Capture 3 seconds of raw axis readings. This includes axis averages and variation; triggers or nonstandard axes need not rest at zero.", "松开所有操作部件，采集 3 秒原始轴值，查看平均值和波动。扳机或非标准映射的轴不一定以 0 为静置位置。", "Suelta los controles y captura 3 segundos de valores originales. Se muestran media y variación; gatillos o ejes no estándar no tienen por qué reposar en cero.")}</p><div className={styles.controls}><button disabled={!active || restRemaining !== null} onClick={() => { restSamples.current = []; restStart.current = performance.now(); setRestRemaining(3); setRest(null); }}>{restRemaining === null ? t("Sample rest position · 3 s", "采集静置位置 · 3 秒", "Medir reposo · 3 s") : `${restRemaining.toFixed(1)} s`}</button><button disabled={!active || !pad.rumble} onClick={() => void vibrate()}>{t("Test vibration · 0.3 s", "测试震动 · 0.3 秒", "Probar vibración · 0,3 s")}</button></div>
      <div className={styles.table}><table><thead><tr><th>{t("Axis", "轴", "Eje")}</th><th>{t("Observed min / max", "本轮最小／最大", "Mín. / máx.")}</th><th>{t("Rest mean", "静置平均值", "Media en reposo")}</th><th>{t("Max deviation from mean", "距平均值最大偏差", "Desviación máxima")}</th></tr></thead><tbody>{pad.axes.map((_, i) => <tr key={i}><th>{i}</th><td>{s.min[i]?.toFixed(3) ?? "—"} / {s.max[i]?.toFixed(3) ?? "—"}</td><td>{rest?.mean[i]?.toFixed(4) ?? "—"}</td><td>{rest?.maxDeviation[i]?.toFixed(4) ?? "—"}</td></tr>)}</tbody></table></div></section>
    </>}
    <SaveCheckup tool="gamepad" disabled={active || !pad || !s.samples} metrics={[metric("mapping", ["Mapping", "映射", "Mapeo"], pad?.mapping || null), metric("buttons", ["Observed buttons", "已按过的按键", "Botones observados"], s.pressed.filter(n => n > 0).length), metric("axes", ["Axes", "轴数", "Ejes"], pad?.axes.length ?? 0), metric("samples", ["Samples", "采样数", "Muestras"], s.samples), ...(rest?.mean.slice(0, 16).map((value, i) => metric(`rest${i}`, [`Axis ${i} rest mean`, `轴 ${i} 静置平均`, `Media del eje ${i}`], Number(value.toFixed(5)))) ?? [])]}/>
    <p className={styles.hint}>{t("Esc, hiding this page or changing windows stops sampling and cancels vibration when supported. Use an actual controller to validate the controls; a browser report cannot certify mechanical condition.", "按 Esc、隐藏页面或切换窗口会停止采样，并在支持时取消震动。请用实体手柄确认响应，浏览器数据不能认证机械部件状态。", "Esc, ocultar la página o cambiar de ventana detiene el muestreo y cancela la vibración si es posible. Confirma las respuestas con un mando físico.")}</p>
  </div>;
}
