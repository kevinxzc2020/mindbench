import { translations, type Lang } from "./translations";
import { CATALOG, COLLECTIONS } from "./collections";
import { CONVERTERS } from "./converters";
import { DRIVER_DEVICES, driverPath } from "./driver-library";
import { MINI_GAMES } from "./mini-games";
import { INFORMATION_CONTENT, INFORMATION_LABELS } from "./site-information";
import { GAMES } from "./utils";
import { DEVICE_TOOLS } from "../components/device/diagnostic-copy";

/**
 * Every page that has a language variant, with its translated `<title>` and meta description.
 * Paths are the un-prefixed (English) URLs; `/zh` and `/es` variants are derived from them.
 * Server-side only: it pulls in the whole catalogue, so client components should not import it.
 */
export const SITE_NAME = "MindBench";

export interface RouteCopy { title: string; description: string }
interface RouteInfo {
  copy: Record<Lang, RouteCopy>;
  /** Draft or private pages: rendered in every language but kept out of search results. */
  noindex?: boolean;
  /** Indexable pages that are not worth listing in the sitemap (thin or utility pages). */
  skipSitemap?: boolean;
}

const TOOL_INDEX: Record<Lang, 0 | 1 | 2> = { en: 0, zh: 1, es: 2 };
const withSite = (title: string) => `${title} | ${SITE_NAME}`;
const perLang = (build: (lang: Lang) => RouteCopy): Record<Lang, RouteCopy> => ({ en: build("en"), zh: build("zh"), es: build("es") });
const fixed = (copy: Record<Lang, RouteCopy>, extra: Omit<RouteInfo, "copy"> = {}): RouteInfo => ({ copy, ...extra });

const DRIVER_SUFFIX: Record<Lang, string> = { en: "official downloads", zh: "官方驱动与下载", es: "descargas oficiales" };
const DRAFT_WORD: Record<Lang, string> = { en: "draft", zh: "草案", es: "borrador" };
/**
 * How people usually search for the most-used checks, added to the Chinese and Spanish meta descriptions.
 * The on-page names (键盘检测, Prueba de teclado) stay as they are; English metadata is left untouched.
 */
const SEARCH_PHRASES: Partial<Record<string, { zh: string; es: string }>> = {
  keyboard: { zh: "在线键盘测试，免费使用，无需安装或登录。", es: "Test de teclado online, gratis y sin instalar nada." },
  mouse: { zh: "在线鼠标测试：检查左右键、侧键、滚轮与双击问题。", es: "Test de ratón online: botones, laterales, rueda y dobles clics." },
  microphone: { zh: "在线麦克风测试，可录音并回放，无需安装。", es: "Test de micrófono online con grabación y reproducción, sin instalar nada." },
  webcam: { zh: "在线摄像头测试，无需安装。", es: "Test de cámara web online, sin instalar nada." },
  screen: { zh: "在线屏幕测试：纯色、渐变与坏点检查。", es: "Test de pantalla online: colores sólidos, degradados y píxeles muertos." },
  speakers: { zh: "在线耳机与扬声器测试，左右声道分别试听。", es: "Test de auriculares y altavoces online con canales izquierdo y derecho." },
};

function buildRoutes(): Map<string, RouteInfo> {
  const routes = new Map<string, RouteInfo>();
  const add = (path: string, info: RouteInfo) => { if (!routes.has(path)) routes.set(path, info); };

  add("/", fixed(perLang(lang => ({ title: translations[lang].siteTitle, description: translations[lang].siteDesc }))));
  add("/collections", fixed({
    en: { title: withSite("Collections"), description: "Browse MindBench collections: cognitive tests, device tools, official resources, sound, personality and games." },
    zh: { title: withSite("全部合集"), description: "浏览 MindBench 全部合集：能力测试、设备自检、官方驱动资料、实用工具，以及性格测试与小游戏。" },
    es: { title: withSite("Colecciones"), description: "Explora las colecciones de MindBench: pruebas cognitivas, comprobación de dispositivos, controladores oficiales, herramientas, personalidad y juegos." },
  }));
  for (const collection of COLLECTIONS) {
    add(`/collections/${collection.id}`, fixed(perLang(lang => ({ title: withSite(collection.name[lang]), description: collection.description[lang] }))));
  }

  for (const [id, tool] of Object.entries(DEVICE_TOOLS)) {
    add(`/tools/${id}`, fixed(perLang(lang => {
      const intro = tool.intro[TOOL_INDEX[lang]];
      const phrase = lang === "en" ? undefined : SEARCH_PHRASES[id]?.[lang];
      return { title: withSite(tool.title[TOOL_INDEX[lang]]), description: phrase ? `${intro} ${phrase}` : intro };
    })));
  }

  for (const game of GAMES) {
    if ("hidden" in game && game.hidden) continue;
    add(`/games/${game.id}`, fixed(perLang(lang => ({ title: withSite(translations[lang][game.titleKey]), description: translations[lang][game.descKey] }))));
  }
  for (const game of MINI_GAMES) {
    add(`/games/minigames/${game.slug}`, fixed(perLang(lang => ({ title: withSite(game.title[lang]), description: game.description[lang] }))));
  }

  const discover = (id: string) => CATALOG.discover.find(entry => entry.id === id)!;
  add("/iq-test", fixed(perLang(lang => ({ title: withSite(discover("iq").title[lang]), description: discover("iq").description[lang] }))));
  add("/mbti", fixed(perLang(lang => ({ title: withSite(translations[lang].mbtiTitle), description: translations[lang].mbtiDesc }))));
  add("/mbti/characters", fixed({
    en: { title: withSite("16 original MBTI characters"), description: "Meet the 16 original characters of the MindBench personality explorer, grouped by color." },
    zh: { title: withSite("16 位原创 MBTI 角色"), description: "认识 MindBench 性格探索中的 16 位原创角色，按色系分组浏览。" },
    es: { title: withSite("16 personajes originales de MBTI"), description: "Conoce a los 16 personajes originales del explorador de personalidad de MindBench, agrupados por color." },
  }));
  add("/tarot", fixed(perLang(lang => ({ title: withSite(translations[lang].tarotTitle), description: `${translations[lang].tarotDesc} — ${discover("tarot").description[lang]}` }))));

  add("/convert", fixed({
    en: { title: withSite("File converters — Images, PDF, audio & data"), description: "Convert images, PDF pages, audio and CSV / JSON files locally in your browser. Choose files, set the output and download." },
    zh: { title: withSite("文件转换：图片、PDF、音频与表格数据"), description: "在浏览器本地转换图片、PDF 页面、音频以及 CSV / JSON 文件：选择文件、设置输出，然后下载。" },
    es: { title: withSite("Conversores de archivos: imágenes, PDF, audio y datos"), description: "Convierte imágenes, páginas de PDF, audio y archivos CSV / JSON localmente en tu navegador. Elige los archivos, ajusta la salida y descarga." },
  }));
  for (const tool of CONVERTERS) {
    add(`/convert/${tool.id}`, fixed(perLang(lang => ({ title: withSite(tool.title[lang]), description: tool.description[lang] }))));
  }

  for (const device of DRIVER_DEVICES) {
    add(driverPath(device), fixed(perLang(lang => ({ title: withSite(`${device.brandName[lang]} ${device.name} — ${DRIVER_SUFFIX[lang]}`), description: device.description[lang] }))));
  }

  // Information pages. The drafts say so in their title and stay out of search results in every language.
  const information = (kind: keyof (typeof INFORMATION_LABELS)["en"], path: string, extra: Omit<RouteInfo, "copy">) => add(path, fixed(perLang(lang => ({
    title: withSite(extra.noindex ? `${INFORMATION_LABELS[lang][kind]} — ${DRAFT_WORD[lang]}` : INFORMATION_LABELS[lang][kind]),
    description: INFORMATION_CONTENT[lang][kind].intro,
  })), extra));
  information("about", "/about", {});
  information("contact", "/contact", { skipSitemap: true });
  information("privacy", "/privacy", { noindex: true });
  information("terms", "/terms", { noindex: true });
  information("cookies", "/cookies", { noindex: true });
  information("rights", "/privacy-rights", { noindex: true });

  return routes;
}

let cache: Map<string, RouteInfo> | undefined;
const routes = () => (cache ??= buildRoutes());

/** The route's translated copy, or `undefined` for a path that is not a registered public page. */
export function routeInfo(path: string): RouteInfo | undefined {
  return routes().get(path);
}

/** Un-prefixed paths for the sitemap: every indexable public page that is worth crawling. */
export function sitemapPaths(): string[] {
  return Array.from(routes()).filter(([, info]) => !info.noindex && !info.skipSitemap).map(([path]) => path);
}

/** Every registered path, including pages kept out of search results. */
export function registeredPaths(): string[] {
  return Array.from(routes().keys());
}
