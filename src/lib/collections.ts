import { GAMES } from "./utils";
import { MINI_GAMES } from "./mini-games";
import { GAME_COVERS, MINI_GAME_COVERS } from "./game-covers";
import { translations, type Lang } from "./translations";
import { DRIVER_DEVICES, driverPath } from "./driver-library";
import { LABORATORY_ART } from "./laboratory-art";
import { ENTRY_COVERS } from "./entry-covers";
import { COLLECTION_NAV, type CollectionId } from "./collection-navigation";
export type { CollectionId } from "./collection-navigation";

export type Localized = Record<Lang, string>;
export const words = (en: string, zh: string, es: string): Localized => ({ en, zh, es });
export interface Collection {
  id: CollectionId;
  name: Localized;
  description: Localized;
  topics: Localized;
  image: string;
  imageAlt: Localized;
}

const collectionDetails: readonly Omit<Collection, "name" | "image" | "imageAlt">[] = [
  { id: "mind", description: words("Find your focus. Test your memory, reaction and precision.", "测测反应、记忆与精准度，记录每一次进步。", "Pon a prueba tu memoria, tus reflejos y tu precisión."), topics: words("Memory / Reaction / Precision", "记忆 / 反应 / 精准度", "Memoria / Reflejos / Precisión") },
  { id: "devices", description: words("A place for checking the tools you use every day.", "从键盘到屏幕，按设备找到需要的检查。", "Un lugar para comprobar los dispositivos de cada día."), topics: words("Keyboard / Mouse / Screen", "键盘 / 鼠标 / 屏幕", "Teclado / Ratón / Pantalla") },
  { id: "drivers", description: words("Find official software, firmware and support by model.", "按型号找到官方软件、固件与使用说明。", "Encuentra software, firmware y ayuda oficial por modelo."), topics: words("Software / Firmware / Guides", "软件 / 固件 / 说明书", "Software / Firmware / Guías") },
  { id: "utilities", description: words("Record, replay and download audio. More voice tools are planned.", "录音、回放与音频下载，更多声音处理工具正在规划。", "Graba, escucha y descarga audio. Hay más herramientas de voz previstas."), topics: words("Recording / Playback / Download", "录音 / 回放 / 下载", "Grabación / Reproducción / Descarga") },
  { id: "discover", description: words("Explore your personality, try tarot or take a break with a mini-game.", "探索 MBTI、IQ 趣测与塔罗，也能玩一局轻松的小游戏。", "Explora tu personalidad, prueba el tarot o descansa con un minijuego."), topics: words("Personality / Tarot / Mini-games", "性格 / 塔罗 / 小游戏", "Personalidad / Tarot / Minijuegos") },
];
// One source for the order and names used by the homepage, header and footer.
export const COLLECTIONS: readonly Collection[] = COLLECTION_NAV.map(item => ({
  ...collectionDetails.find(c => c.id === item.id)!, ...item, image: LABORATORY_ART[item.id].src, imageAlt: LABORATORY_ART[item.id].alt,
}));

export interface CatalogEntry {
  id: string;
  title: Localized;
  description: Localized;
  group: Localized;
  /** A missing href means planned. Never manufacture a working route. */
  href?: string;
  external?: boolean;
  image?: string;
  keywords?: string;
}
const group = {
  cognitive: words("Cognitive tests", "认知测试", "Pruebas cognitivas"),
  puzzle: words("Puzzles", "益智解谜", "Puzles"),
  casual: words("Arcade", "休闲游戏", "Arcade"),
  moba: words("Practice", "操作练习", "Práctica"),
  mini: words("Mini-games", "小游戏", "Minijuegos"),
  input: words("Keyboard & mouse", "键盘与鼠标", "Teclado y ratón"),
  screen: words("Display", "屏幕显示", "Pantalla"),
  media: words("Audio & video", "音频与视频", "Audio y vídeo"),
  controller: words("Touch & controllers", "触控与手柄", "Táctil y mandos"),
  system: words("Environment & reports", "环境与报告", "Entorno e informes"),
  voice: words("Voice tools", "声音处理", "Herramientas de voz"),
  explore: words("Fun assessments", "趣味测试", "Tests por diversión"),
};
const planned = (id: string, title: Localized, description: Localized, category: Localized): CatalogEntry => ({ id, title, description, group: category });
const deviceTool = (id: string, title: Localized, description: Localized, category: Localized): CatalogEntry => ({ id, title, description, group: category, href: `/tools/${id}`, image: ENTRY_COVERS[id] });
const gameEntries = GAMES.filter(g => !("hidden" in g && g.hidden)).map(g => ({
  id: g.id,
  title: words(translations.en[g.titleKey], translations.zh[g.titleKey], translations.es[g.titleKey]),
  description: words(translations.en[g.descKey], translations.zh[g.descKey], translations.es[g.descKey]),
  group: group[g.category], href: `/games/${g.id}`, image: GAME_COVERS[g.id], category: g.category,
}));

export const CATALOG: Record<CollectionId, readonly CatalogEntry[]> = {
  mind: gameEntries.filter(g => g.category === "cognitive"),
  devices: [
    deviceTool("keyboard", words("Keyboard tester", "键盘检测", "Prueba de teclado"), words("Key response, repeated input and simultaneous key combinations.", "逐键响应、异常连击与多键同时按下检查。", "Respuesta de teclas, entradas repetidas y combinaciones simultáneas."), group.input),
    deviceTool("mouse", words("Mouse buttons & drag", "鼠标按键与拖拽", "Botones y arrastre"), words("Buttons, suspicious double clicks, drag continuity and pointer trails.", "按键响应、疑似双击、断拖与移动轨迹检查。", "Botones, dobles clics sospechosos, continuidad del arrastre y trazos."), group.input),
    deviceTool("wheel", words("Scroll wheel tester", "滚轮检测", "Prueba de rueda"), words("Directional scrolling, unexpected reversals and horizontal input.", "检查滚动方向、反向跳动和横向滚动输入。", "Dirección de desplazamiento, inversiones inesperadas y entrada horizontal."), group.input),
    deviceTool("trackpad", words("Trackpad tester", "触控板检测", "Prueba de panel táctil"), words("Clicking, dragging and two-finger scrolling in your browser.", "检查网页中的点击、拖动与双指滚动表现。", "Clics, arrastre y desplazamiento con dos dedos en el navegador."), group.input),
    deviceTool("screen", words("Screen inspection", "屏幕检查", "Inspección de pantalla"), words("Fullscreen colors, gradients and guided inspection with manual location marking.", "全屏纯色、渐变与蛇形分区引导，观察并标记待复核位置。", "Colores y degradados a pantalla completa, recorrido por zonas y marcas manuales."), group.screen),
    { ...deviceTool("motion", words("Motion & frame timing", "拖影与流畅度", "Movimiento y fluidez"), words("Moving patterns and browser frame timing to help you inspect motion.", "用运动图案与网页帧间隔辅助观察显示表现。", "Patrones en movimiento e intervalos entre fotogramas del navegador."), group.screen), href: "/tools/screen?mode=motion" },
    deviceTool("speakers", words("Headphones & speakers", "耳机与音箱", "Auriculares y altavoces"), words("Left/right channels, pure tones, frequency sweeps and listening observations.", "左右声道、纯音、扫频与听音观察记录。", "Canales izquierdo y derecho, tonos, barridos y observaciones auditivas."), group.media),
    deviceTool("microphone", words("Microphone tester", "麦克风检测", "Prueba de micrófono"), words("Input levels, waveforms, device selection and local recording playback.", "输入电平、波形、设备选择与本地录音回放。", "Niveles, formas de onda, selección de entrada y grabación local."), group.media),
    deviceTool("webcam", words("Webcam tester", "摄像头检测", "Prueba de cámara"), words("A live preview, camera selection and current video stream settings.", "实时预览、摄像头切换与当前视频流参数。", "Vista previa, selección de cámara y ajustes del vídeo actual."), group.media),
    deviceTool("gamepad", words("Gamepad tester", "手柄检测", "Prueba de mando"), words("Buttons, triggers, stick centering and vibration where supported.", "按键、扳机、摇杆回中及受支持设备的震动检查。", "Botones, gatillos, centrado de palancas y vibración si es compatible."), group.controller),
    deviceTool("touch", words("Touchscreen tester", "触摸屏检测", "Prueba de pantalla táctil"), words("Multi-touch paths, contact counts and edge coverage.", "多点触控轨迹、触点数量与边缘区域检查。", "Trazos multitáctiles, número de contactos y cobertura de bordes."), group.controller),
    deviceTool("pen", words("Stylus tester", "触控笔检测", "Prueba de lápiz"), words("Pressure, tilt and continuous strokes on supported devices.", "检查受支持设备的压感、倾斜值与笔迹连续性。", "Presión, inclinación y trazos continuos en dispositivos compatibles."), group.controller),
    deviceTool("environment", words("Browser readiness", "浏览器检测环境", "Compatibilidad del navegador"), words("Check which device interfaces your browser can use.", "查看浏览器支持哪些检测接口和运行条件。", "Comprueba qué interfaces puede utilizar tu navegador."), group.system),
    deviceTool("device-reports", words("Checkup history", "自检记录", "Historial de pruebas"), words("Keep test summaries and compare your own repeat checks.", "保存检测摘要与复测记录，导出自己的检查报告。", "Guarda resúmenes, compara pruebas y exporta tus informes."), group.system),
  ],
  drivers: DRIVER_DEVICES.map(device => ({ id: `${device.brand}-${device.slug}`, title: words(`${device.brandName.en} ${device.name}`, `${device.brandName.zh} ${device.name}`, `${device.brandName.es} ${device.name}`), description: device.description, group: device.brandName, href: driverPath(device), keywords: [...device.keywords, device.modelCode.replace(/-/g, ""), device.name.replace(/ /g, "")].join(" ") })),
  utilities: [
    { id: "voice-recorder", title: words("Record & replay", "录音与回放", "Grabar y escuchar"), description: words("Use the microphone tool to record locally, replay and download your audio.", "在麦克风工具中录音、回放并下载音频，录音保存在本地。", "Usa la herramienta de micrófono para grabar localmente, escuchar y descargar audio."), group: group.voice, href: "/tools/microphone", image: ENTRY_COVERS["voice-recorder"] },
    planned("voice-effects", words("Voice effects", "趣味变声", "Efectos de voz"), words("Robot, echo and filtered voices, with an original/effect comparison.", "机器人、回声与滤波效果，切换原声与变声试听。", "Voces robóticas, eco y filtros, con comparación de original y efecto."), group.voice),
    planned("pitch", words("Pitch studio", "实时变调", "Cambio de tono"), words("Explore higher and lower pitches while keeping the pace of your speech.", "尝试更高或更低的音调，保留说话的节奏。", "Explora tonos más altos y bajos manteniendo el ritmo del habla."), group.voice),
    planned("voice-routing", words("Use your voice elsewhere", "跨软件使用变声", "Voz en otras aplicaciones"), words("A planned guide to using additional virtual audio software with chat and games.", "计划整理虚拟音频软件的配置指南，连接聊天与游戏语音。", "Una guía prevista para conectar software de audio virtual con chats y juegos."), group.voice),
  ],
  discover: [
    { id: "iq", title: words("IQ-style challenge", "IQ 趣味测试", "Reto de razonamiento"), description: words("Explore patterns and different ways of thinking.", "从图形与规律中探索不同的思维方式。", "Explora patrones y distintas formas de pensar."), group: group.explore, href: "/iq-test", image: LABORATORY_ART.iq.src },
    { id: "mbti", title: words("Personality explorer", "MBTI 性格探索", "Explorador de personalidad"), description: words("Reflect on your preferences and meet your personality character.", "了解自己的偏好，遇见属于你的性格角色。", "Reflexiona sobre tus preferencias y descubre tu personaje."), group: group.explore, href: "/mbti", image: LABORATORY_ART.mbti.src, keywords: "mbti 16 personality 性格 人格" },
    { id: "tarot", title: words("Three-card tarot", "三张塔罗牌", "Tarot de tres cartas"), description: words("A little imagination. A different perspective on your day.", "给今天一点想象，也换个角度看问题。", "Un poco de imaginación y otra perspectiva para tu día."), group: group.explore, href: "/tarot", image: LABORATORY_ART.tarot.src },
    ...gameEntries.filter(g => g.category !== "cognitive").map(g => ({ ...g, group: group.mini, keywords: Object.values(g.group).join(" ") })),
    ...MINI_GAMES.map(g => ({ id: g.id, title: g.title, description: g.description, group: group.mini, href: `/games/minigames/${g.slug}`, image: MINI_GAME_COVERS[g.id as keyof typeof MINI_GAME_COVERS] })),
  ],
};

export function getCollection(id: string) { return COLLECTIONS.find(c => c.id === id); }
export function matchesEntry(entry: CatalogEntry, query: string) {
  const text = [entry.id, entry.keywords ?? "", ...Object.values(entry.title), ...Object.values(entry.description), ...Object.values(entry.group)].join(" ").normalize("NFKC").toLocaleLowerCase();
  return query.normalize("NFKC").toLocaleLowerCase().trim().split(/\s+/).every(part => text.includes(part));
}
