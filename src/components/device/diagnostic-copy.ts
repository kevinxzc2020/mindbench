import type { Lang } from "@/lib/translations";
import type { DiagnosticTool } from "@/lib/device-diagnostics";

export const DEVICE_TOOLS: Record<DiagnosticTool, { title: [string, string, string]; intro: [string, string, string] }> = {
  webcam: { title: ["Webcam tester", "摄像头检测", "Prueba de cámara"], intro: ["Check your camera feed, compare settings and capture a local snapshot.", "查看摄像头画面、实际视频参数，并拍摄本地截图。", "Comprueba la cámara, compara ajustes y captura una imagen local."] },
  gamepad: { title: ["Gamepad tester", "手柄检测", "Prueba de mando"], intro: ["Inspect buttons, triggers and raw stick axes. Compare a hands-off sample.", "查看按键、扳机与摇杆原始输入，采集静置样本。", "Comprueba botones, gatillos, ejes y una muestra en reposo."] },
  touch: { title: ["Touchscreen tester", "触摸屏检测", "Prueba táctil"], intro: ["Trace the grid and edges. See the contacts your browser receives.", "划过网格和边缘，观察浏览器收到的同时触点。", "Recorre la cuadrícula y los bordes y observa los contactos recibidos."] },
  pen: { title: ["Stylus tester", "触控笔检测", "Prueba de lápiz"], intro: ["Explore pressure, tilt, buttons and continuous pen strokes.", "观察触控笔压感、倾斜、按键与笔迹连续性。", "Observa presión, inclinación, botones y trazos continuos."] },
  trackpad: { title: ["Trackpad tester", "触控板检测", "Prueba de panel táctil"], intro: ["Inspect clicks, dragging and scrolling received by this page.", "观察页面收到的点击、拖动与滚动输入。", "Revisa clics, arrastre y desplazamiento recibidos por la página."] },
  environment: { title: ["Browser readiness", "浏览器检测环境", "Compatibilidad del navegador"], intro: ["Check browser interfaces, permission states and local storage before testing.", "检测前查看浏览器接口、权限状态与本地存储可用性。", "Comprueba interfaces, permisos y almacenamiento antes de probar."] },
  "device-reports": { title: ["Checkup history", "自检记录", "Historial de pruebas"], intro: ["Keep local summaries, compare repeat checks and export your records.", "保存本地摘要，对比复测结果，导出自己的记录。", "Guarda resúmenes locales, compara pruebas y exporta tus registros."] },
  speakers: { title: ["Headphones & speakers", "耳机与音箱检测", "Auriculares y altavoces"], intro: ["Listen left, right and together. Compare channels with tones, sweeps and noise.", "分别试听左右声道，用纯音、扫频与噪声检查播放表现。", "Escucha izquierda, derecha y ambos. Compara canales con tonos, barridos y ruido."] },
  microphone: { title: ["Microphone tester", "麦克风检测", "Prueba de micrófono"], intro: ["See your input, record a short clip and listen back. All in your browser.", "查看输入信号，录制一段并回放确认，全部在浏览器本地完成。", "Observa la entrada, graba un fragmento y escúchalo. Todo en tu navegador."] },
  screen: { title: ["Screen inspection", "屏幕检测", "Inspección de pantalla"], intro: ["Solid colors, smooth gradients and moving targets. Take a closer look at your display.", "用纯色、渐变与运动图案，仔细检查你的屏幕表现。", "Colores sólidos, degradados y objetivos en movimiento. Observa tu pantalla con detalle."] },
  keyboard: { title: ["Keyboard tester", "键盘检测", "Prueba de teclado"], intro: ["Every key, every press. See what your browser actually receives.", "逐个按下，逐个确认。看清浏览器实际收到的按键输入。", "Cada tecla, cada pulsación. Observa lo que recibe el navegador."] },
  mouse: { title: ["Mouse buttons & drag", "鼠标按键与拖拽", "Botones y arrastre"], intro: ["Check your buttons, inspect rapid clicks and follow every drag.", "检查按键响应、疑似异常连点，以及拖拽是否连续。", "Comprueba los botones, los clics rápidos y la continuidad del arrastre."] },
  wheel: { title: ["Scroll wheel tester", "滚轮检测", "Prueba de rueda"], intro: ["See every direction. Look for unexpected input in a one-way test.", "记录每次滚动方向，用单向测试查找反向跳动。", "Observa cada dirección y busca entradas opuestas en una prueba unidireccional."] },
};
export function localText(lang: Lang, en: string, zh: string, es: string) { return lang === "zh" ? zh : lang === "es" ? es : en; }
export function toolText(lang: Lang, text: [string, string, string]) { return localText(lang, ...text); }

export const COMMON = {
  back: ["Device checkup", "设备自检", "Pruebas de dispositivos"],
  start: ["Start testing", "开始检测", "Iniciar prueba"],
  pause: ["Pause", "暂停检测", "Pausar"],
  reset: ["Reset session", "重置本轮", "Reiniciar sesión"],
  active: ["Listening in the test area", "正在检测区域内接收输入", "Escuchando en el área de prueba"],
  idle: ["Paused · press Start to listen", "已暂停 · 点击开始检测", "En pausa · pulsa Iniciar"],
  local: ["Local session · no account needed · inputs are not uploaded", "本地检测 · 无需登录 · 检测输入不上传", "Sesión local · sin cuenta · las entradas no se suben"],
  focus: ["Losing focus or switching windows pauses the test. Esc also pauses.", "检测区域失去焦点或切换窗口会自动暂停，也可按 Esc 暂停。", "Perder el foco o cambiar de ventana pausa la prueba. Esc también la pausa."],
  report: ["Export report", "导出检测报告", "Exportar informe"],
  csv: ["Export event CSV", "导出事件 CSV", "Exportar eventos CSV"],
  exportHint: ["Pause to export. Reset clears this session; leaving the page does not save it.", "暂停后可导出。重置会清空本轮记录，离开页面不会自动保存。", "Pausa para exportar. Reiniciar borra la sesión; salir no la guarda."],
  events: ["Event record", "输入事件记录", "Registro de eventos"],
  all: ["All events", "全部事件", "Todos los eventos"],
  suspects: ["Observations to review", "待复核记录", "Observaciones a revisar"],
  noEvents: ["No input received yet. Start, then use the test area.", "尚未收到输入。开始检测后，请在检测区域内操作。", "Aún no hay entradas. Inicia y utiliza el área de prueba."],
  noSuspects: ["No observations in this session. This alone does not certify the device.", "本轮暂无待复核记录；这不等于设备已通过硬件认证。", "No hay observaciones en esta sesión. Esto no certifica el dispositivo."],
  time: ["Time", "时间", "Tiempo"], event: ["Event", "事件", "Evento"], target: ["Input", "输入", "Entrada"], detail: ["Detail", "详情", "Detalle"],
  summary: ["Session summary", "本轮摘要", "Resumen de sesión"],
  limits: ["How to read the result", "如何理解结果", "Cómo interpretar el resultado"],
  how: ["How to test", "检测方法", "Cómo probar"],
  settings: ["Test settings", "检测设置", "Ajustes de prueba"],
  settingHint: ["Pause to change settings. Changing a threshold or mode starts a fresh session.", "暂停后可更改设置；更改阈值或模式会新开一轮。", "Pausa para cambiar ajustes. Cambiar umbral o modo inicia una sesión nueva."],
  interrupted: ["Pauses", "暂停次数", "Pausas"],
  keys: ["Keys received", "已收到的按键", "Teclas recibidas"],
  notTested: ["Not received", "尚未收到", "No recibida"],
  received: ["Received", "已收到", "Recibida"],
  held: ["Held now", "正在按住", "Pulsada ahora"],
  review: ["Review", "需复核", "Revisar"],
} satisfies Record<string, [string, string, string]>;

export const EVENT_NAMES: Record<string, [string, string, string]> = {
  keydown: ["Key down", "按下", "Pulsación"], keyup: ["Key up", "松开", "Liberación"], repeat: ["Auto-repeat", "长按自动重复", "Repetición automática"],
  "rapid-repress": ["Rapid re-press", "短间隔重复按下", "Pulsación repetida rápida"], "down-without-up": ["Missing key release", "未收到松开即再次按下", "Pulsación sin liberación"], "keyup-only": ["Key press (release only)", "按键（系统只发送松开）", "Pulsación (solo liberación)"], "release-hidden-by-os": ["Release hidden by OS", "系统未发送松开", "Liberación oculta por el sistema"],
  mousedown: ["Button down", "鼠标按下", "Botón pulsado"], mouseup: ["Button up", "鼠标松开", "Botón liberado"],
  "rapid-click-pair": ["Rapid click pair", "短间隔连续点击", "Par de clics rápidos"], "double-click": ["Browser double-click", "浏览器双击事件", "Doble clic del navegador"],
  "drag-complete": ["Drag completed", "拖拽完成", "Arrastre completado"], "drag-early-release": ["Released before target", "到终点前已松开", "Liberación antes del destino"],
  "release-not-received": ["Release event missing", "未收到松开事件", "Falta evento de liberación"],
  wheel: ["Wheel input", "滚动输入", "Entrada de rueda"], "opposite-direction": ["Opposite direction", "与设定方向相反", "Dirección opuesta"],
  "zoom-ignored": ["Zoom input excluded", "已排除缩放输入", "Zoom excluido"], paused: ["Test paused", "检测暂停", "Prueba pausada"],
};
