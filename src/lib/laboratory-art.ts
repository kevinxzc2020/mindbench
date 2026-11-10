import type { Lang } from "./translations";

/** ImageGen conceptual entry artwork; not screenshots or manufacturer product photos. */
type LaboratoryArtwork = { src: string; alt: Record<Lang, string> };
const art = (id: string, en: string, zh: string, es: string): LaboratoryArtwork => ({
  src: `/images/laboratory/${id}-v1.jpg`, alt: { en, zh, es },
});

export const LABORATORY_ART = {
  home: art("home", "An ivory keyboard, mouse, display and headphones on a light testing workbench", "浅色检测台上的键盘、鼠标、显示器和耳机", "Teclado, ratón, pantalla y auriculares en una mesa de pruebas clara"),
  mind: art("mind", "A reaction button, memory tile pad and precision target", "反应按钮、记忆方格和精准度靶盘", "Un botón de reacción, una cuadrícula de memoria y un blanco de precisión"),
  devices: art("devices", "A magnifying lens inspecting a keyboard beside a mouse and USB cable", "放大镜下的键盘，旁边放着鼠标和 USB 线", "Una lupa sobre un teclado junto a un ratón y un cable USB"),
  utilities: art("utilities", "A microphone, headphones and an audio recorder with a waveform", "麦克风、耳机和显示音频波形的录音设备", "Micrófono, auriculares y una grabadora con una onda de audio"),
  drivers: art("drivers", "Concept illustration of a mouse, receiver, manuals and download folders", "鼠标、接收器、说明书与下载资料夹的概念配图", "Ilustración conceptual de un ratón, receptor, manuales y carpetas de descargas"),
  discover: art("discover", "A reasoning puzzle, personality sculptures, three cards and a wooden puzzle cube", "图形推理拼图、性格雕塑、三张卡牌与木质益智方块", "Un puzle de razonamiento, figuras de personalidad, tres cartas y un cubo de madera"),
  iq: art("iq", "A geometric pattern puzzle with one empty space and three candidate pieces", "留有一个空位的图形规律拼图和三块候选图形", "Un patrón geométrico con un hueco y tres piezas posibles"),
  mbti: art("mbti", "Four personality sculptures in purple, blue, green and yellow", "紫、蓝、绿、黄四色的性格主题雕塑", "Cuatro figuras de personalidad en morado, azul, verde y amarillo"),
  tarot: art("tarot", "Three illustrated cards showing a sun, a moon and an open path", "分别绘有太阳、月亮和开放道路的三张卡牌", "Tres cartas ilustradas con un sol, una luna y un camino abierto"),
} as const;
