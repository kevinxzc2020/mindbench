"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, Maximize, Square } from "lucide-react";
import { metric } from "@/lib/device-history";
import { useDeviceText } from "./DiagnosticShared";
import { SaveCheckup } from "./SaveCheckup";
import styles from "./ExtendedDiagnostics.module.css";

export type CameraCapture = (constraints: MediaStreamConstraints) => Promise<MediaStream>;
export function WebcamTester({ capture }: { capture?: CameraCapture } = {}) {
  const { t } = useDeviceText(); const text = useRef(t); text.current = t;
  const video = useRef<HTMLVideoElement>(null), stage = useRef<HTMLDivElement>(null), stream = useRef<MediaStream | null>(null);
  const request = useRef(0), mounted = useRef(false), frame = useRef(0), imageUrl = useRef("");
  const [status, setStatus] = useState<"idle" | "requesting" | "active">("idle"), [supported, setSupported] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]), [device, setDevice] = useState(""), [size, setSize] = useState("1280x720"), [fps, setFps] = useState(30);
  const [mirror, setMirror] = useState(true), [grid, setGrid] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [settings, setSettings] = useState<MediaTrackSettings | null>(null), [label, setLabel] = useState(""), [muted, setMuted] = useState(false), [decoded, setDecoded] = useState({ width: 0, height: 0 });
  const [delivered, setDelivered] = useState<number | null>(null), [snapshot, setSnapshot] = useState<{ url: string; width: number; height: number; mirror: boolean } | null>(null);
  const refresh = useCallback(async () => { try { const list = await navigator.mediaDevices?.enumerateDevices(); if (mounted.current) setDevices(list?.filter(d => d.kind === "videoinput" && d.deviceId) ?? []); } catch { /* Default capture remains available. */ } }, []);
  const stop = useCallback(() => {
    request.current++;
    const el = video.current; if (el && frame.current) el.cancelVideoFrameCallback?.(frame.current); frame.current = 0;
    stream.current?.getTracks().forEach(track => { track.onended = null; track.onmute = null; track.onunmute = null; track.stop(); }); stream.current = null;
    if (el) { el.pause(); el.srcObject = null; }
    if (mounted.current) { setStatus("idle"); setMuted(false); }
  }, []);
  useEffect(() => {
    mounted.current = true; setSupported(window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === "function"); void refresh();
    const hidden = () => { if (document.hidden) { stop(); setNotice(text.current("Camera released because the page is hidden.", "页面进入后台，摄像头已释放。", "Cámara liberada al ocultar la página.")); } };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.fullscreenElement) stop(); };
    navigator.mediaDevices?.addEventListener("devicechange", refresh); document.addEventListener("visibilitychange", hidden); window.addEventListener("keydown", escape);
    return () => { mounted.current = false; stop(); if (imageUrl.current) URL.revokeObjectURL(imageUrl.current); navigator.mediaDevices?.removeEventListener("devicechange", refresh); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("keydown", escape); };
  }, [refresh, stop]);
  const start = async () => {
    stop(); const id = ++request.current; setStatus("requesting"); setError(""); setNotice(""); setSettings(null); setLabel(""); setDecoded({ width: 0, height: 0 }); setDelivered(null);
    let input: MediaStream | null = null;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new DOMException("Unsupported", "NotSupportedError");
      const [width, height] = size.split("x").map(Number);
      const constraints: MediaStreamConstraints = { audio: false, video: { ...(device ? { deviceId: { exact: device } } : { facingMode: { ideal: "user" } }), width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: fps } } };
      input = await (capture ? capture(constraints) : navigator.mediaDevices.getUserMedia(constraints));
      if (!mounted.current || id !== request.current) { input.getTracks().forEach(track => track.stop()); return; }
      const track = input.getVideoTracks()[0]; if (!track) throw new DOMException("No video", "NotFoundError");
      const el = video.current; if (!el) throw new Error("Missing preview");
      stream.current = input; el.srcObject = input; setSettings(track.getSettings()); setLabel(track.label || text.current("Default camera", "默认摄像头", "Cámara predeterminada")); setMuted(track.muted);
      track.onended = () => { stop(); setError(text.current("Camera disconnected or access ended. Reconnect, refresh and start again.", "摄像头已断开或访问已结束，请重新连接、刷新后再开启。", "La cámara se desconectó o terminó el acceso. Reconecta e inicia de nuevo.")); };
      track.onmute = () => setMuted(true); track.onunmute = () => setMuted(false);
      await el.play(); if (!mounted.current || id !== request.current) return;
      setStatus("active"); setDecoded({ width: el.videoWidth, height: el.videoHeight }); void refresh();
      if (typeof el.requestVideoFrameCallback === "function") {
        let startTime = 0, base = 0;
        const observe: VideoFrameRequestCallback = (now, metadata) => {
          if (id !== request.current || !mounted.current) return;
          if (!startTime) { startTime = now; base = metadata.presentedFrames; }
          if (now - startTime >= 1000) { setDelivered(Number(((metadata.presentedFrames - base) / ((now - startTime) / 1000)).toFixed(1))); startTime = now; base = metadata.presentedFrames; }
          frame.current = el.requestVideoFrameCallback(observe);
        };
        frame.current = el.requestVideoFrameCallback(observe);
      }
    } catch (e) {
      input?.getTracks().forEach(track => track.stop());
      if (mounted.current && id === request.current) {
        stop(); const name = e instanceof Error ? e.name : "";
        setError(name === "NotAllowedError" || name === "SecurityError"
          ? text.current("Camera access was denied. Check this site's camera permission and your system privacy settings.", "摄像头访问被拒绝，请检查本站摄像头权限与系统隐私设置。", "Acceso a la cámara denegado. Revisa el permiso del sitio y la privacidad del sistema.")
          : name === "NotFoundError" ? text.current("No matching camera was found. Connect a camera, refresh the device list and try again.", "未找到对应的摄像头，请连接设备、刷新设备列表后重试。", "No se encontró una cámara compatible. Conéctala, actualiza la lista e inténtalo de nuevo.")
          : name === "NotReadableError" || name === "AbortError" ? text.current("The camera could not start. It may be busy in another app or unavailable to the browser.", "摄像头无法启动，可能正被其他应用占用，或当前浏览器无法访问。", "No se pudo iniciar la cámara. Puede estar ocupada por otra aplicación o no disponible.")
          : name === "OverconstrainedError" ? text.current("The selected camera settings could not be used. Try the system default camera or a lower requested resolution.", "无法使用所选摄像头设置，请尝试系统默认设备或降低请求分辨率。", "No se pudieron usar los ajustes seleccionados. Prueba la cámara predeterminada o una resolución menor.")
          : name === "NotSupportedError" ? text.current("Camera access is unavailable here. Use a supported browser over HTTPS or localhost.", "此环境无法访问摄像头，请使用支持此功能的浏览器并通过 HTTPS 或 localhost 打开。", "La cámara no está disponible aquí. Usa un navegador compatible en HTTPS o localhost.")
          : text.current("The camera preview could not start. Stop, refresh the devices and try again.", "摄像头预览启动失败，请停止、刷新设备后重试。", "No se pudo iniciar la vista previa. Detén, actualiza los dispositivos e inténtalo de nuevo."));
      }
    }
  };
  const takeSnapshot = () => {
    const el = video.current; if (status !== "active" || !el || el.readyState < 2 || !el.videoWidth) return;
    const canvas = document.createElement("canvas"); canvas.width = el.videoWidth; canvas.height = el.videoHeight; const ctx = canvas.getContext("2d"); if (!ctx) return;
    if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); } ctx.drawImage(el, 0, 0); const id = request.current;
    canvas.toBlob(blob => { if (!blob || !mounted.current || id !== request.current) return; if (imageUrl.current) URL.revokeObjectURL(imageUrl.current); imageUrl.current = URL.createObjectURL(blob); setSnapshot({ url: imageUrl.current, width: canvas.width, height: canvas.height, mirror }); }, "image/png");
  };
  const change = (fn: () => void) => { stop(); fn(); setNotice(""); };
  const fullscreen = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await stage.current?.requestFullscreen(); } catch { setError(t("Fullscreen is unavailable here. You can still use the preview.", "此环境无法进入全屏，仍可使用页面预览。", "La pantalla completa no está disponible; puedes usar la vista previa.")); } };
  return <div className={styles.root}>
    <p className={styles.intro}>{t("Check framing, focus and lighting with a live preview. Camera access starts only after you press Enable and grant permission. Audio is never requested by this tool.", "用实时预览检查取景、清晰度和光线。点击开启并授权后才会采集摄像头；此工具不请求音频。", "Revisa encuadre, enfoque e iluminación en directo. Solo accede a la cámara tras pulsar Activar y autorizarla. No solicita audio.")}</p>
    {supported === false && <p className={styles.error}>{t("Camera access needs a supported browser in a secure context (HTTPS or localhost).", "需要在安全上下文（HTTPS 或 localhost）的受支持浏览器中使用摄像头。", "La cámara requiere un navegador compatible en HTTPS o localhost.")}</p>}
    <div className={styles.fields}><label>{t("Camera", "摄像头设备", "Cámara")}<select disabled={status === "requesting"} value={device} onChange={e => change(() => setDevice(e.target.value))}><option value="">{t("System default", "系统默认", "Predeterminada")}</option>{devices.map((d, i) => <option value={d.deviceId} key={d.deviceId}>{d.label || `${t("Camera", "摄像头", "Cámara")} ${i + 1}`}</option>)}</select></label><label>{t("Requested resolution", "请求分辨率", "Resolución solicitada")}<select value={size} onChange={e => change(() => setSize(e.target.value))}>{["640x480", "1280x720", "1920x1080", "3840x2160"].map(s => <option value={s} key={s}>{s.replace("x", " × ")}</option>)}</select></label><label>{t("Requested frame rate", "请求帧率", "Frecuencia solicitada")}<select value={fps} onChange={e => change(() => setFps(Number(e.target.value)))}>{[15, 30, 60].map(n => <option key={n} value={n}>{n} fps</option>)}</select></label></div>
    <div className={styles.controls}><button className={styles.primary} disabled={supported === false} onClick={() => status === "idle" ? void start() : stop()}>{status === "idle" ? <Camera size={16}/> : <Square size={16}/>} {status === "requesting" ? t("Cancel request", "取消请求", "Cancelar solicitud") : status === "active" ? t("Stop & release camera", "停止并释放摄像头", "Detener y liberar") : t("Enable camera", "开启摄像头", "Activar cámara")}</button><button onClick={() => void refresh()}>{t("Refresh devices", "刷新设备", "Actualizar")}</button><label className={styles.check}><input type="checkbox" checked={mirror} onChange={e => setMirror(e.target.checked)}/>{t("Mirror", "镜像", "Espejo")}</label><label className={styles.check}><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)}/>{t("Center guide", "中心参考线", "Guía central")}</label><span className={styles.status}>{status === "requesting" ? t("Waiting for permission…", "等待浏览器授权…", "Esperando permiso…") : status === "active" ? muted ? t("Stream muted", "视频流被静默", "Flujo silenciado") : t("Camera active", "摄像头已开启", "Cámara activa") : t("Camera off", "摄像头已关闭", "Cámara apagada")}</span></div>
    {status === "requesting" && <p role="status" className={styles.hint}>{t("Allow camera access in the browser prompt. If no prompt appears, check site permissions or cancel and open this tool in your regular browser.", "请在浏览器提示中允许摄像头。若无提示，请检查本站权限，或取消后在普通浏览器打开此工具。", "Permite la cámara en el aviso. Si no aparece, revisa los permisos o cancela y prueba en tu navegador habitual.")}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.hint}>{notice}</p>}
    <div ref={stage} className={styles.videoStage}><video ref={video} muted playsInline style={{ transform: mirror ? "scaleX(-1)" : undefined }} aria-label={t("Live camera preview", "摄像头实时预览", "Vista previa de cámara")} onResize={() => { const el = video.current; if (el && el.videoWidth) setDecoded({ width: el.videoWidth, height: el.videoHeight }); }}/>{status !== "active" && <div className={styles.placeholder}><Camera size={46}/><span>{t("Your camera preview appears here", "摄像头画面将在这里显示", "La vista previa aparecerá aquí")}</span></div>}{grid && status === "active" && <div className={styles.crosshair}/>}<button style={{ position: "absolute", top: 12, right: 12 }} onClick={() => void fullscreen()} aria-label={t("Toggle preview fullscreen", "切换预览全屏", "Cambiar pantalla completa")}><Maximize size={16}/></button></div>
    <div className={styles.stats}><div><span>{t("Video frame size", "视频帧尺寸", "Tamaño del vídeo")}</span><strong>{decoded.width ? `${decoded.width} × ${decoded.height}` : "—"}</strong></div><div><span>{t("Negotiated fps", "协商帧率", "FPS negociados")}</span><strong>{settings?.frameRate ?? "—"}</strong></div><div><span>{t("Presented frames / second", "预览呈现帧／秒", "Fotogramas presentados / s")}</span><strong>{status === "active" ? delivered ?? "—" : "—"}</strong></div></div>
    {label && <p className={styles.hint}>{label}</p>}
    <p className={styles.hint}>{t("Requested settings are preferences. Actual frame size and negotiated frame rate appear above; preview timing is not a sensor performance certification. The mirror affects both the preview and saved snapshot, not the camera settings.", "请求设置是偏好值，实际视频尺寸与协商帧率以上方返回值为准；预览帧率不是传感器性能认证。镜像影响预览与截图，不改变摄像头设置。", "Los ajustes solicitados son preferencias. Arriba figuran los valores reales. El ritmo de vista previa no certifica el sensor. El espejo afecta a la vista y a la captura.")}</p>
    <div className={styles.controls}><button disabled={status !== "active" || muted || !decoded.width} onClick={takeSnapshot}><Camera size={15}/>{t("Take local snapshot", "拍摄本地截图", "Capturar imagen local")}</button></div>
    {snapshot && <section className={styles.panel}><h2>{t("Last snapshot", "最近截图", "Última captura")}</h2><img className={styles.snapshot} src={snapshot.url} alt={t("Camera snapshot", "摄像头截图", "Captura de cámara")}/><p className={styles.hint}>{snapshot.width} × {snapshot.height} · {snapshot.mirror ? t("Mirrored", "已镜像", "En espejo") : t("Unmirrored", "未镜像", "Sin espejo")}</p><div className={styles.controls}><a className={styles.upload} href={snapshot.url} download="mindbench-camera.png"><Download size={15}/>&nbsp;{t("Download PNG", "下载 PNG", "Descargar PNG")}</a><button onClick={() => { URL.revokeObjectURL(imageUrl.current); imageUrl.current = ""; setSnapshot(null); }}>{t("Discard snapshot", "移除截图", "Descartar captura")}</button></div></section>}
    <SaveCheckup tool="webcam" disabled={status !== "idle" || !settings} metrics={[metric("width", ["Video width", "视频宽度", "Ancho del vídeo"], decoded.width || null, "px"), metric("height", ["Video height", "视频高度", "Alto del vídeo"], decoded.height || null, "px"), metric("negotiatedFps", ["Negotiated fps", "协商帧率", "FPS negociados"], settings?.frameRate ?? null), metric("facingMode", ["Reported facing mode", "报告的朝向", "Orientación informada"], settings?.facingMode ?? null)]}/>
    <p className={styles.hint}>{t("Video and snapshots stay in this page until you download them or leave. Stopping releases the camera. A picture looking dark or blurry can have several causes; compare lighting, focus and another camera before drawing a hardware conclusion.", "画面与截图只保留在当前页面，下载后保存在你的设备；离开页面会清除。停止会释放摄像头。偏暗或模糊可能有多种原因，请对照光线、对焦与其他摄像头复核。", "El vídeo y las capturas permanecen en esta página salvo descarga. Detener libera la cámara. Una imagen oscura o borrosa puede tener distintas causas: compara luz, enfoque y otra cámara.")}</p>
  </div>;
}
