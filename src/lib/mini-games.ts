import type { Lang } from "./translations";

export type MiniGameId = "screw" | "fruit" | "arrow" | "sheep-planet" | "goose-3d" | "beads";

export interface MiniGameDefinition {
  id: MiniGameId;
  slug: string;
  sourcePath: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  instructions: Record<Lang, string>;
  tag: Record<Lang, string>;
}

/** Non-duplicate browser games imported from IcedSoul/minigame-everyday. */
export const MINI_GAMES: readonly MiniGameDefinition[] = [
  {
    id: "screw", slug: "screw", sourcePath: "/minigames/screw/index.html",
    title: { en: "Screw Sort", zh: "打个螺丝", es: "Ordena los tornillos" },
    description: { en: "Clear every board by routing each screw to the right box.", zh: "把螺丝归位，清空所有板块。", es: "Lleva cada tornillo a su caja y limpia el tablero." },
    instructions: { en: "Tap an exposed screw and route it to the matching box. Keep the five-slot buffer from filling up.", zh: "点击露出的螺丝，把它送进同色工具箱。备选区的五个位置不能全部占满。", es: "Toca un tornillo visible y llévalo a la caja del mismo color. No llenes las cinco casillas del buffer." },
    tag: { en: "DAY 01 / SORT", zh: "DAY 01 / 收纳", es: "DÍA 01 / ORDENAR" },
  },
  {
    id: "fruit", slug: "fruit", sourcePath: "/minigames/fruit/index.html",
    title: { en: "Fruit Funnel", zh: "消个水果", es: "Frutas al embudo" },
    description: { en: "Guide falling fruit through the funnel and match colors to clear them.", zh: "让水果顺着漏斗下落，凑齐同色消除。", es: "Guía las frutas por el embudo y combina sus colores." },
    instructions: { en: "Tap a fruit to send it down the funnel. Build matching color groups before the channel jams.", zh: "点击水果，让它落入漏斗。凑齐同色水果，并避免通道堵满。", es: "Toca una fruta para enviarla por el embudo. Forma grupos del mismo color antes de atascar el canal." },
    tag: { en: "DAY 02 / MATCH", zh: "DAY 02 / 消除", es: "DÍA 02 / COMBINAR" },
  },
  {
    id: "arrow", slug: "arrow", sourcePath: "/minigames/arrow/index.html",
    title: { en: "Arrow Run", zh: "一箭又一箭", es: "Flechas en ruta" },
    description: { en: "Send each arrow along its path and empty the grid before time runs out.", zh: "让箭头沿路径飞出，在倒计时结束前清空棋盘。", es: "Envía cada flecha por su ruta y despeja la cuadrícula." },
    instructions: { en: "Tap an arrow to send it along its path. Avoid blocked routes, protect your three hearts, and clear the grid before time runs out.", zh: "点击箭头让它沿路径飞出。避开被挡住的路线，保护三颗心，并在倒计时结束前清空棋盘。", es: "Toca una flecha para enviarla por su ruta. Evita los bloqueos, protege tus tres corazones y despeja la cuadrícula antes de que termine el tiempo." },
    tag: { en: "DAY 03 / PATH", zh: "DAY 03 / 路径", es: "DÍA 03 / RUTA" },
  },
  {
    id: "beads", slug: "beads", sourcePath: "/minigames/beads/index.html",
    title: { en: "Pixel Beads", zh: "快乐拼拼豆", es: "Cuentas pixel" },
    description: { en: "Move connected color regions from the holding tray back into the pattern.", zh: "取出连通的同色豆，再把它们放回图案空位。", es: "Mueve regiones de color conectadas para completar el patrón." },
    instructions: { en: "Select a connected color region, then place it into the matching empty pattern cells. Keep an eye on the tray and timer.", zh: "选中连通的同色区域，再把它放入对应颜色的图案空位。留意暂存槽和倒计时。", es: "Selecciona una región conectada y colócala en las casillas vacías del mismo color. Vigila la bandeja y el tiempo." },
    tag: { en: "DAY 06 / PIXEL", zh: "DAY 06 / 拼豆", es: "DÍA 06 / PÍXEL" },
  },
];

export function getMiniGame(slug: string) {
  return MINI_GAMES.find((game) => game.slug === slug);
}
