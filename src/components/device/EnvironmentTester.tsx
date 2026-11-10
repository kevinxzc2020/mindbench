"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { metric } from "@/lib/device-history";
import { useDeviceText } from "./DiagnosticShared";
import { SaveCheckup } from "./SaveCheckup";
import styles from "./ExtendedDiagnostics.module.css";

interface Capability { id: string; name: string; api: boolean; allowed: boolean | null; route?: string }
interface EnvironmentSnapshot { at: string; secure: boolean; width: number; height: number; screenWidth: number; screenHeight: number; dpr: number; touches: number; coarse: boolean; hover: boolean; storage: boolean; rows: Capability[]; camera: string; microphone: string }
type PolicyDocument = Document & { permissionsPolicy?: { allowsFeature: (feature: string) => boolean }; featurePolicy?: { allowsFeature: (feature: string) => boolean } };

export function EnvironmentTester() {
  const { t } = useDeviceText();
  const [snapshot, setSnapshot] = useState<EnvironmentSnapshot | null>(null), [busy, setBusy] = useState(false);
  const operation = useRef(0);
  useEffect(() => () => { operation.current++; }, []);
  const inspect = async () => {
    const id = ++operation.current; setBusy(true);
    const policy = (document as PolicyDocument).permissionsPolicy ?? (document as PolicyDocument).featurePolicy;
    const allowed = (feature: string): boolean | null => { try { return policy ? policy.allowsFeature(feature) : null; } catch { return null; } };
    const permission = async (name: string) => { try { return (await navigator.permissions.query({ name: name as PermissionName })).state; } catch { return "unknown"; } };
    let storage = false; const probe = `mindbench-probe-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem(probe, "1"); storage = localStorage.getItem(probe) === "1"; localStorage.removeItem(probe); } catch { /* Report a failed probe without changing saved records. */ }
    const result: EnvironmentSnapshot = {
      at: new Date().toISOString(), secure: window.isSecureContext, width: innerWidth, height: innerHeight,
      screenWidth: screen.width, screenHeight: screen.height, dpr: devicePixelRatio, touches: navigator.maxTouchPoints ?? 0,
      coarse: matchMedia("(any-pointer: coarse)").matches, hover: matchMedia("(any-hover: hover)").matches, storage,
      rows: [
        { id: "camera", name: "MediaDevices · camera", api: typeof navigator.mediaDevices?.getUserMedia === "function", allowed: allowed("camera"), route: "webcam" },
        { id: "microphone", name: "MediaDevices · microphone", api: typeof navigator.mediaDevices?.getUserMedia === "function", allowed: allowed("microphone"), route: "microphone" },
        { id: "gamepad", name: "Gamepad API", api: typeof navigator.getGamepads === "function", allowed: allowed("gamepad"), route: "gamepad" },
        { id: "pointer", name: "Pointer Events", api: typeof PointerEvent !== "undefined", allowed: null, route: "touch" },
        { id: "audio", name: "Web Audio", api: typeof AudioContext !== "undefined", allowed: null, route: "speakers" },
        { id: "recorder", name: "MediaRecorder", api: typeof MediaRecorder !== "undefined", allowed: null, route: "microphone" },
        { id: "fullscreen", name: "Fullscreen API", api: typeof document.documentElement.requestFullscreen === "function", allowed: document.fullscreenEnabled, route: "screen" },
        { id: "output", name: "HTMLMediaElement.setSinkId", api: "setSinkId" in HTMLMediaElement.prototype, allowed: null, route: "speakers" },
      ], camera: "unknown", microphone: "unknown",
    };
    [result.camera, result.microphone] = await Promise.all([permission("camera"), permission("microphone")]);
    if (id === operation.current) { setSnapshot(result); setBusy(false); }
  };
  const permissionText = (value: string) => value === "granted" ? t("Allowed", "已允许", "Permitido") : value === "denied" ? t("Denied", "已拒绝", "Denegado") : value === "prompt" ? t("Will ask when started", "启用时需询问", "Preguntará al iniciar") : t("Not reported", "浏览器未提供", "No informado");
  return <div className={styles.root}>
    <p className={styles.intro}>{t("Check what this browser exposes before testing your devices. This check does not turn on the camera or microphone and does not send a permission request.", "先检查当前浏览器可用的接口与运行条件。此检查不会开启摄像头或麦克风，也不会请求它们的访问权限。", "Comprueba las interfaces del navegador antes de probar tus dispositivos. No enciende la cámara ni el micrófono ni solicita permisos.")}</p>
    <div className={styles.controls}><button className={styles.primary} disabled={busy} onClick={() => void inspect()}><RefreshCw size={16}/>{busy ? t("Checking…", "检查中…", "Comprobando…") : t("Check this browser", "检查当前浏览器", "Comprobar navegador")}</button>{snapshot && <span className={styles.status}>{new Date(snapshot.at).toLocaleTimeString()}</span>}</div>
    {!snapshot ? <div className={styles.empty}>{t("Run the check to see capability and permission information.", "点击检查，查看接口支持情况与权限状态。", "Inicia la comprobación para ver interfaces y permisos.")}</div> : <>
      <div className={styles.stats}><div><span>{t("Secure context", "安全上下文", "Contexto seguro")}</span><strong>{snapshot.secure ? t("Yes", "是", "Sí") : t("No", "否", "No")}</strong></div><div><span>{t("Viewport · CSS px", "视口 · CSS 像素", "Ventana · px CSS")}</span><strong>{snapshot.width} × {snapshot.height}</strong></div><div><span>{t("Pixel ratio", "像素比例", "Proporción de píxeles")}</span><strong>{snapshot.dpr}</strong></div><div><span>{t("Reported max touch points", "报告的最大触点数", "Máximo táctil informado")}</span><strong>{snapshot.touches}</strong></div></div>
      <div className={styles.grid}><section className={styles.panel}><h2>{t("Permission state", "权限状态", "Permisos")}</h2><p className={styles.hint}>{t("Camera", "摄像头", "Cámara")}: {permissionText(snapshot.camera)}</p><p className={styles.hint}>{t("Microphone", "麦克风", "Micrófono")}: {permissionText(snapshot.microphone)}</p><p className={styles.hint}>{t("A granted permission is not proof that a device is connected. Change denied permissions using the browser's site settings, then check again.", "已允许不代表设备已连接。若被拒绝，请在浏览器的网站权限设置中修改后重新检查。", "Un permiso concedido no confirma un dispositivo conectado. Cambia los permisos denegados en la configuración del sitio.")}</p></section><section className={styles.panel}><h2>{t("Local environment", "本地环境", "Entorno local")}</h2><p className={styles.hint}>{t("Local history storage", "本地记录存储", "Almacenamiento local")}: {snapshot.storage ? t("Write check succeeded", "写入检查成功", "Escritura comprobada") : t("Unavailable", "不可用", "No disponible")}</p><p className={styles.hint}>{t("Screen size reported in CSS pixels", "浏览器报告的屏幕 CSS 尺寸", "Tamaño de pantalla en px CSS")}: {snapshot.screenWidth} × {snapshot.screenHeight}</p><p className={styles.hint}>{t("Coarse pointer / hover", "粗指针／悬停支持", "Puntero grueso / hover")}: {snapshot.coarse ? "✓" : "—"} / {snapshot.hover ? "✓" : "—"}</p></section></div>
      <div className={styles.table}><table><thead><tr><th>{t("Interface", "接口", "Interfaz")}</th><th>{t("Browser support", "浏览器支持", "Soporte")}</th><th>{t("Page policy", "页面策略", "Política")}</th><th>{t("Next step", "下一步", "Siguiente paso")}</th></tr></thead><tbody>{snapshot.rows.map(row => <tr key={row.id}><th>{row.name}</th><td>{row.api ? t("Interface present", "接口存在", "Interfaz presente") : t("Not exposed", "未提供", "No disponible")}</td><td>{row.allowed === false ? t("Blocked", "受限制", "Bloqueado") : row.allowed === true ? t("Allowed by page", "页面策略允许", "Permitido") : t("Not checked / not applicable", "未检查／不适用", "No comprobado / no aplica")}</td><td>{row.route && <Link href={`/tools/${row.route}`}>{t("Open tool →", "打开工具 →", "Abrir →")}</Link>}</td></tr>)}</tbody></table></div>
      <SaveCheckup tool="environment" metrics={[metric("secure", ["Secure context", "安全上下文", "Contexto seguro"], snapshot.secure), metric("storage", ["Local storage", "本地存储", "Almacenamiento local"], snapshot.storage), metric("touchPoints", ["Reported max touch points", "报告的最大触点数", "Máximo táctil informado"], snapshot.touches), metric("viewport", ["Viewport", "视口", "Ventana"], `${snapshot.width} × ${snapshot.height}`, "CSS px"), metric("dpr", ["Pixel ratio", "像素比例", "Proporción de píxeles"], snapshot.dpr), ...snapshot.rows.map(row => metric(row.id, [row.name, row.name, row.name], row.api))]}/>
    </>}
    <p className={styles.hint}>{t("An interface being present does not certify connected hardware or browser compatibility. Screen dimensions are software-reported, not a measurement of native panel resolution. Recheck after changing browser permissions or moving between displays.", "接口存在不代表已连接对应设备，也不保证全部行为兼容。屏幕尺寸是软件报告值，不是面板原生分辨率的实测。修改权限或切换显示器后请重新检查。", "La presencia de una interfaz no certifica hardware conectado ni compatibilidad completa. Las dimensiones son datos de software, no una medida del panel. Repite tras cambiar permisos o pantalla.")}</p>
  </div>;
}
