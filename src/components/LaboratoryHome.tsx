"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, AudioLines, Brain, Camera, Check, ChevronRight, ClipboardList, FileDown, Gamepad2, Keyboard, Mic, Monitor, Mouse, MoveVertical, Search, ShieldCheck, Sparkles, Target, Trophy, Wrench, X, Zap } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { CATALOG, COLLECTIONS, matchesEntry, type CatalogEntry, type CollectionId } from "@/lib/collections";
import { LABORATORY_ART } from "@/lib/laboratory-art";
import { AdSenseBanner } from "./AdSenseBanner";
import { CONVERTERS } from "@/lib/converters";
import styles from "./LaboratoryHome.module.css";

/** Hand-picked games shown right under the hero; ids that lose their route or cover are skipped. */
const GAME_PICKS = ["goose-grab", "sheep", "screw", "fruit", "number-chain", "reaction-time"];

const ICONS = { mind: Brain, devices: Monitor, utilities: Wrench, drivers: FileDown, discover: Sparkles };
export const TOOL_ICONS: Record<string, typeof Keyboard> = { keyboard: Keyboard, mouse: Mouse, wheel: MoveVertical, screen: Monitor, microphone: Mic, speakers: AudioLines, webcam: Camera, "reaction-time": Zap, "cps-test": Mouse, "aim-trainer": Target, "voice-recorder": Mic, "device-reports": ClipboardList, mbti: Sparkles };
const MIND_PICKS = ["reaction-time", "sequence-memory", "number-memory", "aim-trainer"];
const QUICK_CHECKS = [
  { id: "keyboard", summary: { en: "Key response · Repeats · Combos", zh: "按键响应 · 连击 · 多键冲突", es: "Teclas · Repeticiones · Combinaciones" } },
  { id: "mouse", summary: { en: "Buttons · Double clicks · Scroll wheel", zh: "按键 · 疑似双击 · 滚轮", es: "Botones · Doble clic · Rueda" } },
  { id: "screen", summary: { en: "Colors · Dead pixels · Motion", zh: "纯色 · 坏点观察 · 拖影", es: "Colores · Píxeles · Movimiento" } },
  { id: "speakers", summary: { en: "Left / right channels · Test tones", zh: "左右声道 · 测试音 · 扫频", es: "Canales izq. / der. · Tonos" } },
  { id: "microphone", summary: { en: "Input level · Record & replay", zh: "输入电平 · 录音回放", es: "Nivel de entrada · Grabación" } },
  { id: "webcam", summary: { en: "Live preview · Resolution · Frame rate", zh: "实时预览 · 分辨率 · 帧率", es: "Vista previa · Resolución · FPS" } },
] as const;
const HERO_TRUST = [
  { en: "Nothing to install", zh: "无需安装", es: "Sin instalar nada" },
  { en: "No account needed", zh: "无需注册", es: "Sin registrarte" },
  { en: "Test inputs stay on your device", zh: "检测数据留在本机", es: "Los datos quedan en tu equipo" },
] as const;
const MORE_DEVICE_PICKS = ["trackpad", "gamepad", "touch", "pen", "motion", "environment"];
const HOME_COPY = {
  zh: {
    eyebrow: "设备检测与日常实用工具", title: "你想检查什么？", intro: "选择一项，直接开始。检查键鼠、屏幕与声音，无需安装。",
    start: "选择检测工具", explore: "查看自检记录", feature: "从你的设备开始", featureTitle: "每个问题，都有一个检查入口。", featureMeta: "键盘 · 鼠标 · 屏幕 · 声音", featureLink: "打开设备实验室", reaction: "反应时间", personality: "MBTI 性格", tarot: "塔罗",
    play: "测试与趣味探索", playDesc: "挑战能力 · 了解自己 · 轻松玩一局", devices: "设备与实用工具", devicesDesc: "键鼠屏幕 · 声音检测 · 官方驱动", navigation: "首页分区",
    tests: "检查完了，换你挑战一下。", testsDesc: "设备之外，也试试自己的反应、记忆与精准度。", allTests: "全部能力测试",
    discover: "换个角度，认识自己。", discoverDesc: "IQ 趣测、性格探索与塔罗，为好奇心多留一点空间。", allFun: "全部趣味探索", games: "想轻松一点？", gamesDesc: "来一局消除、拼图或小挑战。", playGames: "浏览小游戏",
    deviceTitle: "还有其他设备要检查？", deviceIntro: "继续检查触控板、摄像头、手柄和触摸设备，或查看浏览器支持哪些检测。", allDevices: "全部设备检测", support: "工具与资料", utilityTitle: "文件与声音工具", utilityDesc: "图片、PDF、音频、表格转换与录音。", driverTitle: "官方驱动资料库", driverDesc: "按品牌和型号找到软件、固件与说明书。", close: "收起搜索结果",
  },
  en: {
    eyebrow: "DEVICE CHECKS & EVERYDAY TOOLS", title: "What needs a check?", intro: "Pick a tool and start. Check your keyboard, mouse, screen or audio. No installation needed.",
    start: "Find a device check", explore: "Checkup history", feature: "Start with your setup", featureTitle: "A useful check for every setup.", featureMeta: "Keyboard · Mouse · Screen · Audio", featureLink: "Open the device lab", reaction: "Reaction time", personality: "MBTI personality", tarot: "Tarot",
    play: "Tests & discovery", playDesc: "Challenge yourself · Get curious · Play a little", devices: "Devices & useful tools", devicesDesc: "Keyboard & mouse · Screen & audio · Drivers", navigation: "Homepage sections",
    tests: "Setup checked. Your turn.", testsDesc: "Explore your reactions, memory and precision when you are ready for a break.", allTests: "All cognitive tests",
    discover: "A different side of you.", discoverDesc: "Reasoning puzzles, personality and tarot. Follow a little curiosity.", allFun: "All fun & discovery", games: "Fancy something lighter?", gamesDesc: "Unwind with a matching game, a puzzle or a small challenge.", playGames: "Browse mini-games",
    deviceTitle: "More devices to check?", deviceIntro: "Check your trackpad, camera, gamepad or touch devices, and see which tests your browser supports.", allDevices: "All device checks", support: "Tools & resources", utilityTitle: "File & audio tools", utilityDesc: "Convert images, PDF, audio and tables, or record sound.", driverTitle: "Official driver library", driverDesc: "Find software, firmware and guides by brand and model.", close: "Close search results",
  },
  es: {
    eyebrow: "DISPOSITIVOS Y HERRAMIENTAS ÚTILES", title: "¿Qué quieres comprobar?", intro: "Elige una prueba y empieza. Revisa teclado, ratón, pantalla o audio sin instalar nada.",
    start: "Elegir una comprobación", explore: "Historial de revisiones", feature: "Empieza por tu equipo", featureTitle: "Una comprobación para tu equipo.", featureMeta: "Teclado · Ratón · Pantalla · Audio", featureLink: "Abrir pruebas de dispositivos", reaction: "Tiempo de reacción", personality: "Personalidad MBTI", tarot: "Tarot",
    play: "Pruebas y descubrimientos", playDesc: "Ponte a prueba · Conócete · Juega un poco", devices: "Dispositivos y herramientas", devicesDesc: "Teclado y ratón · Pantalla y audio · Controladores", navigation: "Secciones de inicio",
    tests: "Equipo revisado. Ahora te toca a ti.", testsDesc: "Explora tus reflejos, memoria y precisión cuando quieras un descanso.", allTests: "Todas las pruebas cognitivas",
    discover: "Otra forma de conocerte.", discoverDesc: "Razonamiento, personalidad y tarot. Sigue tu curiosidad.", allFun: "Explorar todo", games: "¿Algo más ligero?", gamesDesc: "Descansa con un juego de parejas, un puzle o un pequeño reto.", playGames: "Ver minijuegos",
    deviceTitle: "¿Más dispositivos por revisar?", deviceIntro: "Comprueba el panel táctil, la cámara, el mando y los dispositivos táctiles, o consulta qué pruebas admite tu navegador.", allDevices: "Todas las pruebas de dispositivos", support: "Herramientas y recursos", utilityTitle: "Archivos y audio", utilityDesc: "Convierte imágenes, PDF, audio y tablas, o graba sonido.", driverTitle: "Biblioteca de controladores oficiales", driverDesc: "Busca software, firmware y guías por marca y modelo.", close: "Cerrar resultados",
  },
};
const COPY = {
  zh: { eyebrow: "你的在线测试实验室", title: "了解自己，", accent: "也了解你的设备。", intro: "测测反应，检查设备，找到顺手的工具。把好奇心变成看得见的结果。", search: "搜索工具、测试或设备型号…", searchLabel: "搜索所有工具", clear: "清除搜索", hint: "试试：", keyboard: "键盘检测", screen: "屏幕检查", drivers: "驱动资料", feature: "从你的设备开始", featureDesc: "每一次按下，都有回应。", featureLink: "打开设备实验室", featureMeta: "键盘 · 鼠标 · 屏幕 · 声音", categories: "选择一个方向", quick: "现在，测点什么？", quickDesc: "直接打开工具，从一次简单的检查开始。", directory: "找到你需要的工具。", directoryDesc: "按用途筛选，或直接搜索名称与型号。", all: "全部", browse: "浏览全部工具", available: "只看已开放", ready: "已开放", planned: "规划中", open: "打开", results: "个结果", no: "没有找到匹配工具", noDesc: "换一个关键词，或清除筛选重新浏览。", reset: "清除筛选", fun: "给好奇心留一点空间。", funDesc: "性格、思维、小小的未知。认真测试之外，也可以轻松探索。", funLink: "进入趣味探索", games: "想放松一下？玩一局小游戏", records: "每一次尝试，都值得留下。", progress: "测试进步", progressDesc: "回看自己的测试表现。", reports: "自检记录", reportsDesc: "整理设备观察，方便下次复查。", ranking: "排行榜", rankingDesc: "看看其他人的挑战成绩。", local: "设备检测由浏览器接收输入；观察结果需要结合实际设备判断。", tools: "项已开放", catalog: "工具目录" },
  en: { eyebrow: "YOUR ONLINE TEST LAB", title: "Know yourself.", accent: "Know your setup.", intro: "Test your abilities. Check your devices. Find a useful tool. Turn a little curiosity into something you can see.", search: "Search a tool, test or device model…", searchLabel: "Search all tools", clear: "Clear search", hint: "Try:", keyboard: "Keyboard tester", screen: "Screen check", drivers: "Drivers", feature: "Start with your setup", featureDesc: "Every press tells a story.", featureLink: "Open the device lab", featureMeta: "Keyboard · Mouse · Screen · Audio", categories: "Pick your direction", quick: "What will you test today?", quickDesc: "Open a tool and start with one simple check.", directory: "Find the right tool.", directoryDesc: "Browse by purpose, or search for a name or model.", all: "All", browse: "Browse all tools", available: "Available only", ready: "Available", planned: "Planned", open: "Open", results: "results", no: "No matching tools", noDesc: "Try another keyword or clear the filters.", reset: "Clear filters", fun: "Make room for curiosity.", funDesc: "Personality, patterns and a little mystery. Take a break and discover something different.", funLink: "Explore for fun", games: "Need a break? Play a mini-game", records: "Every attempt is worth keeping.", progress: "Test progress", progressDesc: "Revisit your own test performance.", reports: "Checkup history", reportsDesc: "Keep observations for your next check.", ranking: "Leaderboard", rankingDesc: "Explore other players’ scores.", local: "Device tools observe browser input; interpret results alongside your physical device.", tools: "available", catalog: "Tool directory" },
  es: { eyebrow: "TU LABORATORIO DE PRUEBAS", title: "Conócete mejor.", accent: "Conoce tu equipo.", intro: "Prueba tus capacidades, revisa tus dispositivos y encuentra herramientas útiles. Convierte la curiosidad en resultados visibles.", search: "Busca una herramienta, prueba o modelo…", searchLabel: "Buscar todas las herramientas", clear: "Borrar búsqueda", hint: "Prueba:", keyboard: "Probar teclado", screen: "Revisar pantalla", drivers: "Controladores", feature: "Empieza por tu equipo", featureDesc: "Cada pulsación cuenta una historia.", featureLink: "Abrir el laboratorio", featureMeta: "Teclado · Ratón · Pantalla · Audio", categories: "Elige tu camino", quick: "¿Qué probarás hoy?", quickDesc: "Abre una herramienta y empieza con una comprobación sencilla.", directory: "Encuentra tu herramienta.", directoryDesc: "Filtra por uso o busca un nombre o modelo.", all: "Todo", browse: "Ver todas las herramientas", available: "Solo disponibles", ready: "Disponible", planned: "Previsto", open: "Abrir", results: "resultados", no: "No hay coincidencias", noDesc: "Prueba otra palabra o borra los filtros.", reset: "Borrar filtros", fun: "Haz espacio para la curiosidad.", funDesc: "Personalidad, patrones y un poco de misterio. Descansa y descubre algo diferente.", funLink: "Explorar por diversión", games: "¿Un descanso? Juega un minijuego", records: "Cada intento merece un recuerdo.", progress: "Tu progreso", progressDesc: "Revisa tus propios resultados.", reports: "Historial de dispositivos", reportsDesc: "Guarda observaciones para la próxima revisión.", ranking: "Clasificación", rankingDesc: "Explora los resultados de otros jugadores.", local: "Las herramientas observan entradas del navegador; interpreta los resultados junto a tu dispositivo físico.", tools: "disponibles", catalog: "Directorio de herramientas" },
};

function ToolCard({ entry, category }: { entry: CatalogEntry; category: CollectionId }) {
  const { lang } = useLang(); const c = COPY[lang]; const Icon = TOOL_ICONS[entry.id] ?? ICONS[category];
  const content = <>
    {entry.image && <div className={styles.toolImage}><Image src={entry.image} alt="" fill sizes="(max-width: 800px) 46vw, (max-width: 1100px) 30vw, 23vw"/></div>}
    <div className={styles.toolTop}>{!entry.image && <span className={styles.toolIcon} data-category={category}><Icon size={23} strokeWidth={1.7}/></span>}<span className={styles.toolType}>{COLLECTIONS.find(col => col.id === category)!.name[lang]}</span>{entry.href && <ArrowUpRight size={17}/>}</div><h3>{entry.title[lang]}</h3><p>{entry.description[lang]}</p><div className={styles.toolFoot}><span className={entry.href ? styles.ready : styles.planned}>{entry.href ? c.ready : c.planned}</span><span>{entry.href ? c.open : c.planned}{entry.href && <ArrowRight size={14}/>}</span></div>
  </>;
  return entry.href ? <Link href={entry.href} className={styles.toolCard} data-artwork={Boolean(entry.image)}>{content}</Link> : <article className={`${styles.toolCard} ${styles.unavailable}`} data-artwork={Boolean(entry.image)}>{content}</article>;
}

export function LaboratoryHome({ directoryOnly = false }: { directoryOnly?: boolean }) {
  const { lang } = useLang(); const c = COPY[lang]; const h = HOME_COPY[lang];
  const [query, setQuery] = useState(""); const [category, setCategory] = useState<CollectionId | "all">("all"); const [availableOnly, setAvailableOnly] = useState(true);
  const [expanded, setExpanded] = useState(directoryOnly);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [focusResults, setFocusResults] = useState(false);
  const all = COLLECTIONS.flatMap(col => CATALOG[col.id].map(entry => ({ entry, category: col.id })));
  const searching = query.trim().length > 0 || category !== "all" || expanded;
  const filtered = all.filter(row => (category === "all" || row.category === category) && (!availableOnly || row.entry.href) && matchesEntry(row.entry, query));
  // The microphone and recorder deliberately share a route; search shows one useful result per destination.
  const unique = filtered.filter((row, index) => !row.entry.href || filtered.findIndex(other => other.entry.href === row.entry.href) === index);
  const rows = unique;
  const reset = () => { setQuery(""); setCategory("all"); setAvailableOnly(true); };
  const showResults = () => {
    setSuggestionsOpen(false);
    setExpanded(true);
    setFocusResults(true);
  };
  useEffect(() => {
    if (!focusResults) return;
    document.getElementById("catalog-title")?.focus({ preventScroll: true });
    document.getElementById("collections")?.scrollIntoView({ block: "start" });
    setFocusResults(false);
  }, [focusResults]);
  const search = <div className={styles.searchWrap} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSuggestionsOpen(false); }}>
    <form role="search" className={styles.searchBox} onSubmit={e => { e.preventDefault(); showResults(); }}>
      <button type="submit" aria-label={c.searchLabel}><Search size={21}/></button><label className="sr-only" htmlFor="tool-search">{c.searchLabel}</label><input id="tool-search" type="search" autoComplete="off" placeholder={c.search} value={query} onFocus={() => setSuggestionsOpen(true)} onChange={e => { setQuery(e.target.value); setSuggestionsOpen(true); }} onKeyDown={e => { if (e.key === "Escape") setSuggestionsOpen(false); }}/>{query && <button type="button" onClick={() => setQuery("")} aria-label={c.clear}><X size={18}/></button>}
    </form>
    {suggestionsOpen && query.trim() && <div className={styles.searchResults} aria-label={c.searchLabel}><p role="status">{unique.length} {c.results}</p>{unique.slice(0,5).map(({entry,category: resultCategory}) => entry.href ? <Link key={entry.id} href={entry.href}><span>{entry.title[lang]}<small>{COLLECTIONS.find(col=>col.id===resultCategory)!.name[lang]}</small></span><ArrowUpRight size={17}/></Link> : <div key={entry.id}>{entry.title[lang]}<small>{c.planned}</small></div>)}{unique.length ? <button type="button" onClick={showResults}>{c.browse}<ArrowRight size={16}/></button> : <p>{c.noDesc}</p>}</div>}
  </div>;
  return <div className={styles.page}>
    {directoryOnly ? <section className={styles.directoryHero} aria-labelledby="lab-title">
      <p className={styles.eyebrow}><span/>{c.catalog}</p>
      <h1 id="lab-title">{c.directory}</h1>
      <p className={styles.intro}>{c.directoryDesc}</p>
      {search}
      <div className={styles.searchHints}><span>{c.hint}</span><Link href="/tools/keyboard">{c.keyboard}</Link><Link href="/tools/screen">{c.screen}</Link><Link href="/collections/drivers">{c.drivers}</Link></div>
    </section> : <><div className={styles.mobileTopAd}><AdSenseBanner placement="top" format="horizontal"/></div><section className={styles.hero} aria-labelledby="lab-title">
      <div className={styles.heroMain}>
        <p className={styles.eyebrow}><span/>{h.eyebrow}</p>
        <h1 id="lab-title">{h.title}</h1>
        <p className={styles.heroIntro}>{h.intro}</p>
        <div className={styles.heroSearch}>{search}<Link href="/collections" className={styles.heroBrowse}>{c.browse}<ArrowRight size={15}/></Link></div>
      </div>
      <aside className={styles.heroArt} aria-label={h.support}>
        <div className={styles.heroAd}><AdSenseBanner placement="hero" format="rectangle"/></div>
        <div className={styles.heroImage}><Image src={LABORATORY_ART.home.src} alt={LABORATORY_ART.home.alt[lang]} fill priority sizes="(max-width: 760px) 120px, 340px"/></div>
        <ul className={styles.heroTrust}>{HERO_TRUST.map(item => <li key={item.en}><Check size={14} aria-hidden="true"/>{item[lang]}</li>)}</ul>
      </aside>
      <nav className={styles.heroChecks} aria-label={h.start}>
        {QUICK_CHECKS.map(({id, summary}) => {
          const entry = CATALOG.devices.find(item => item.id === id);
          if (!entry?.href) return null;
          const Icon = TOOL_ICONS[id];
          return <Link href={entry.href} key={id} className={styles.heroCheck}>
            <span className={styles.heroCheckIcon}><Icon size={22} aria-hidden="true"/></span>
            <span className={styles.heroCheckText}><strong>{entry.title[lang]}</strong><small>{summary[lang]}</small></span>
            <ArrowUpRight size={17} className={styles.heroCheckArrow} aria-hidden="true"/>
          </Link>;
        })}
      </nav>
      <div className={styles.heroFoot}>
        <Link href="/collections/devices" className={styles.heroAll}>{h.allDevices} <span>{CATALOG.devices.filter(entry => entry.href && entry.id !== "device-reports").length}</span><ArrowRight size={16}/></Link>
        <Link href="/tools/device-reports"><ClipboardList size={16}/>{h.explore}</Link>
        <Link href="/collections/drivers"><FileDown size={16}/>{h.driverTitle}</Link>
      </div>
    </section></>}
    {!directoryOnly && <section className={styles.gameShelf} aria-labelledby="game-picks-title">
      <div className={styles.gameShelfHead}><div><span className={styles.eyebrow}>PLAY / {lang === "zh" ? "小游戏" : lang === "es" ? "MINIJUEGOS" : "MINI-GAMES"}</span><h2 id="game-picks-title">{{ en: "Take a quick break", zh: "来玩一局", es: "Tómate un descanso" }[lang]}</h2></div><Link href="/collections/discover" className={styles.gameShelfAll}>{{ en: "All games", zh: "全部小游戏", es: "Todos los juegos" }[lang]}<ArrowRight size={15}/></Link></div>
      <div className={styles.gameShelfRow}>{GAME_PICKS.map(id => [...CATALOG.discover, ...CATALOG.mind].find(entry => entry.id === id)).filter((entry): entry is CatalogEntry => Boolean(entry?.href && entry.image)).map(entry => <Link key={entry.id} href={entry.href!} className={styles.gameCard}>
        <span className={styles.gameCover}><Image src={entry.image!} alt="" fill sizes="(max-width: 600px) 44vw, 210px"/></span>
        <strong>{entry.title[lang]}</strong><small>{entry.group[lang]}</small>
      </Link>)}</div>
    </section>}
    {!directoryOnly && <div className={styles.ad}><AdSenseBanner placement="home"/></div>}
    {(directoryOnly || searching) && <section id="collections" className={styles.catalog} aria-labelledby="catalog-title"><div className={styles.sectionHead}><div><p className={styles.eyebrow}>/ {c.catalog}</p><h2 id="catalog-title" tabIndex={-1}>{c.browse}</h2><p>{c.directoryDesc}</p></div>{!directoryOnly && <button type="button" onClick={() => { reset(); setExpanded(false); }}>{h.close}<X size={17}/></button>}</div>
      <div className={styles.filters}><div role="group" aria-label={c.categories}><button type="button" aria-pressed={category==="all"} onClick={()=>setCategory("all")}>{c.all}</button>{COLLECTIONS.map(col=><button type="button" key={col.id} aria-pressed={category===col.id} onClick={()=>setCategory(col.id)}>{col.name[lang]}</button>)}</div>{searching && <label><input type="checkbox" checked={availableOnly} onChange={e=>setAvailableOnly(e.target.checked)}/>{c.available}</label>}</div>
      <p className={styles.resultCount} role="status">{rows.length} {c.results}</p>{rows.length ? <div className={styles.toolGrid}>{rows.map(row=><ToolCard key={`${row.category}-${row.entry.id}`} {...row}/>)}</div> : <div className={styles.empty}><Search size={30}/><h3>{c.no}</h3><p>{c.noDesc}</p><button type="button" onClick={reset}>{c.reset}<ArrowRight size={16}/></button></div>}
    </section>}
    {!directoryOnly && <>
      <section id="device-lab" className={styles.toolsBand} aria-labelledby="device-title">
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>01 / {h.devices}</p><h2 id="device-title">{{ en: "More tools", zh: "更多工具", es: "Más herramientas" }[lang]}</h2><p>{h.deviceIntro}</p></div><Link href="/collections/devices">{h.allDevices}<ArrowUpRight size={17}/></Link></div>
        <div className={styles.toolsGrid}>
          <div className={styles.toolsPanel}>
            <h3>{{ en: "More device checks", zh: "更多设备检测", es: "Más pruebas de dispositivos" }[lang]}</h3>
            <ul>{MORE_DEVICE_PICKS.map(id => { const entry = CATALOG.devices.find(item => item.id === id); if (!entry?.href) return null; const Icon = TOOL_ICONS[id] ?? Monitor; return <li key={id}><Link href={entry.href} className={styles.toolsRow}><span className={styles.toolsThumb}>{entry.image ? <Image src={entry.image} alt="" fill sizes="44px"/> : <Icon size={20}/>}</span><span><strong>{entry.title[lang]}</strong><small>{entry.description[lang]}</small></span><ArrowUpRight size={15}/></Link></li>; })}</ul>
          </div>
          <div className={styles.toolsPanel}>
            <h3>{{ en: "File converters", zh: "文件转换", es: "Conversores de archivos" }[lang]}</h3>
            <p className={styles.toolsNote}>{{ en: "Converted on your device. Files are not uploaded.", zh: "在本机完成转换，文件不会上传。", es: "Se convierten en tu equipo. No se suben archivos." }[lang]}</p>
            <ul>{CONVERTERS.slice(0, 5).map(tool => <li key={tool.id}><Link href={`/convert/${tool.id}`} className={styles.toolsLink}>{tool.title[lang]}<ArrowUpRight size={14}/></Link></li>)}</ul>
            <Link href="/convert" className={styles.toolsMore}>{{ en: "All converters", zh: "全部转换器", es: "Todos los conversores" }[lang]}<ArrowRight size={15}/></Link>
          </div>
          <div className={styles.toolsPanel}>
            <h3>{{ en: "Drivers & records", zh: "驱动与记录", es: "Controladores e historial" }[lang]}</h3>
            <Link href="/collections/drivers" className={styles.toolsFeature}><FileDown size={22}/><span><strong>{h.driverTitle}</strong><small>{h.driverDesc}</small></span><ChevronRight size={16}/></Link>
            <Link href="/tools/device-reports" className={styles.toolsFeature}><ClipboardList size={22}/><span><strong>{c.reports}</strong><small>{{ en: "Saved summaries of your checks, kept in this browser.", zh: "保存在本浏览器里的检测摘要。", es: "Resúmenes de tus pruebas guardados en este navegador." }[lang]}</small></span><ChevronRight size={16}/></Link>
            <Link href="/collections/utilities" className={styles.toolsFeature}><Wrench size={22}/><span><strong>{h.utilityTitle}</strong><small>{h.utilityDesc}</small></span><ChevronRight size={16}/></Link>
          </div>
        </div>
        <p className={styles.localNote}><ShieldCheck size={15}/>{c.local}</p>
      </section>
      <div className={styles.ad}><AdSenseBanner placement="home-mid"/></div>
      <section id="play-lab" className={styles.playZone} aria-labelledby="play-title">
        <span id="games" className={styles.anchor}/>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>02 / {h.play}</p><h2 id="play-title">{h.tests}</h2><p>{h.testsDesc}</p></div><Link href="/collections/mind">{h.allTests}<ArrowUpRight size={17}/></Link></div>
        <div className={`${styles.toolGrid} ${styles.challengeGrid}`}>{MIND_PICKS.map(id => { const entry = CATALOG.mind.find(item => item.id === id); return entry ? <ToolCard key={id} entry={entry} category="mind"/> : null; })}</div>
        <div className={styles.challengeLinks}><Link href="/progress"><Brain size={17}/>{c.progress}<ArrowRight size={15}/></Link><Link href="/leaderboard"><Trophy size={17}/>{c.ranking}<ArrowRight size={15}/></Link></div>
        <section id="fun-tests" className={styles.exploreBlock} aria-labelledby="explore-title">
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>EXPLORE YOURSELF</p><h2 id="explore-title">{h.discover}</h2><p>{h.discoverDesc}</p></div><Link href="/collections/discover">{h.allFun}<ArrowUpRight size={17}/></Link></div>
          <div className={styles.exploreGrid}>{CATALOG.discover.filter(entry => ["iq", "mbti", "tarot"].includes(entry.id)).map(entry => <ToolCard key={entry.id} entry={entry} category="discover"/>)}</div>
        </section>
      </section>
      <div className={`${styles.ad} ${styles.adBottom}`}><AdSenseBanner placement="home-bottom"/></div>
      <Link href="/collections" className={styles.allTools}><Search size={18}/>{c.browse}<ArrowRight size={18}/></Link>
    </>}
    {directoryOnly && <section className={styles.records} aria-label={c.records}><h2>{c.records}</h2><div>{[{href:"/progress",title:c.progress,desc:c.progressDesc,Icon:Brain},{href:"/tools/device-reports",title:c.reports,desc:c.reportsDesc,Icon:ClipboardList},{href:"/leaderboard",title:c.ranking,desc:c.rankingDesc,Icon:Trophy}].map(({href,title,desc,Icon})=><Link key={href} href={href}><Icon size={22}/><div><h3>{title}</h3><p>{desc}</p></div><ChevronRight size={18}/></Link>)}</div></section>}
  </div>;
}
