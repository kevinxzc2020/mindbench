"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, AudioLines, Brain, ChevronRight, ClipboardList, FileDown, Gamepad2, Keyboard, Mic, Monitor, Mouse, Search, ShieldCheck, Sparkles, Target, Trophy, Wrench, X, Zap } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { CATALOG, COLLECTIONS, matchesEntry, type CatalogEntry, type CollectionId } from "@/lib/collections";
import { LABORATORY_ART } from "@/lib/laboratory-art";
import { AdSenseBanner } from "./AdSenseBanner";
import styles from "./LaboratoryHome.module.css";

const ICONS = { mind: Brain, devices: Monitor, utilities: Wrench, drivers: FileDown, discover: Sparkles };
export const TOOL_ICONS: Record<string, typeof Keyboard> = { keyboard: Keyboard, mouse: Mouse, wheel: Mouse, screen: Monitor, microphone: Mic, speakers: AudioLines, "reaction-time": Zap, "cps-test": Mouse, "aim-trainer": Target, "voice-recorder": Mic, "device-reports": ClipboardList, mbti: Sparkles };
const MIND_PICKS = ["reaction-time", "sequence-memory", "number-memory", "aim-trainer"];
const DEVICE_PICKS = ["keyboard", "mouse", "wheel", "screen", "speakers", "microphone"];
const HOME_COPY = {
  zh: {
    eyebrow: "设备检测与日常实用工具", title: "设备哪里不对劲？", accent: "从这里查一查。", intro: "按键没反应、鼠标连点、滚轮乱跳，还是开会前想确认声音？打开对应工具，检查、记录，再决定下一步。",
    start: "选择检测工具", explore: "查看自检记录", feature: "从你的设备开始", featureTitle: "每个问题，都有一个检查入口。", featureMeta: "键盘 · 鼠标 · 屏幕 · 声音", featureLink: "打开设备实验室", reaction: "反应时间", personality: "MBTI 性格", tarot: "塔罗",
    play: "测试与趣味探索", playDesc: "挑战能力 · 了解自己 · 轻松玩一局", devices: "设备与实用工具", devicesDesc: "键鼠屏幕 · 声音检测 · 官方驱动", navigation: "首页分区",
    tests: "检查完了，换你挑战一下。", testsDesc: "设备之外，也试试自己的反应、记忆与精准度。", allTests: "全部能力测试",
    discover: "换个角度，认识自己。", discoverDesc: "IQ 趣测、性格探索与塔罗，为好奇心多留一点空间。", allFun: "全部趣味探索", games: "想轻松一点？", gamesDesc: "来一局消除、拼图或小挑战。", playGames: "浏览小游戏",
    deviceTitle: "你想检查什么？", deviceIntro: "按键有没有漏按，滚轮会不会反向跳动，声音来自哪一边？把日常设备的小疑问，交给一项具体的检查。", allDevices: "全部设备检测", support: "工具与资料", utilityTitle: "声音实用工具", utilityDesc: "本地录音、回放与音频下载。", driverTitle: "官方驱动资料库", driverDesc: "按品牌和型号找到软件、固件与说明书。", close: "收起搜索结果",
  },
  en: {
    eyebrow: "EVERYDAY TOOLS. CLEARER ANSWERS.", title: "Something not working?", accent: "Start with a simple check.", intro: "A missed key, a jumpy scroll wheel, or no sound before a call? Open a focused tool, check what happens and keep a record for your next step.",
    start: "Find a device check", explore: "Checkup history", feature: "Start with your setup", featureTitle: "A useful check for every setup.", featureMeta: "Keyboard · Mouse · Screen · Audio", featureLink: "Open the device lab", reaction: "Reaction time", personality: "MBTI personality", tarot: "Tarot",
    play: "Tests & discovery", playDesc: "Challenge yourself · Get curious · Play a little", devices: "Devices & useful tools", devicesDesc: "Keyboard & mouse · Screen & audio · Drivers", navigation: "Homepage sections",
    tests: "Setup checked. Your turn.", testsDesc: "Explore your reactions, memory and precision when you are ready for a break.", allTests: "All cognitive tests",
    discover: "A different side of you.", discoverDesc: "Reasoning puzzles, personality and tarot. Follow a little curiosity.", allFun: "All fun & discovery", games: "Fancy something lighter?", gamesDesc: "Unwind with a matching game, a puzzle or a small challenge.", playGames: "Browse mini-games",
    deviceTitle: "What would you like to check?", deviceIntro: "A missed key, a jumpy scroll wheel, sound on the wrong side? Start with a focused check of the devices you use every day.", allDevices: "All device checks", support: "Tools & resources", utilityTitle: "Useful audio tools", utilityDesc: "Record locally, replay and download your audio.", driverTitle: "Official driver library", driverDesc: "Find software, firmware and guides by brand and model.", close: "Close search results",
  },
  es: {
    eyebrow: "HERRAMIENTAS PARA TU DÍA A DÍA", title: "¿Algo no funciona bien?", accent: "Empieza por comprobarlo.", intro: "¿Falla una tecla, salta la rueda o no hay sonido antes de una llamada? Abre una herramienta, observa lo que ocurre y guarda un resumen.",
    start: "Elegir una comprobación", explore: "Historial de revisiones", feature: "Empieza por tu equipo", featureTitle: "Una comprobación para tu equipo.", featureMeta: "Teclado · Ratón · Pantalla · Audio", featureLink: "Abrir pruebas de dispositivos", reaction: "Tiempo de reacción", personality: "Personalidad MBTI", tarot: "Tarot",
    play: "Pruebas y descubrimientos", playDesc: "Ponte a prueba · Conócete · Juega un poco", devices: "Dispositivos y herramientas", devicesDesc: "Teclado y ratón · Pantalla y audio · Controladores", navigation: "Secciones de inicio",
    tests: "Equipo revisado. Ahora te toca a ti.", testsDesc: "Explora tus reflejos, memoria y precisión cuando quieras un descanso.", allTests: "Todas las pruebas cognitivas",
    discover: "Otra forma de conocerte.", discoverDesc: "Razonamiento, personalidad y tarot. Sigue tu curiosidad.", allFun: "Explorar todo", games: "¿Algo más ligero?", gamesDesc: "Descansa con un juego de parejas, un puzle o un pequeño reto.", playGames: "Ver minijuegos",
    deviceTitle: "¿Qué quieres comprobar?", deviceIntro: "¿Una tecla no responde, la rueda salta o el sonido sale del lado incorrecto? Empieza con una comprobación concreta de tus dispositivos.", allDevices: "Todas las pruebas de dispositivos", support: "Herramientas y recursos", utilityTitle: "Herramientas de audio", utilityDesc: "Graba localmente, escucha y descarga tu audio.", driverTitle: "Biblioteca de controladores oficiales", driverDesc: "Busca software, firmware y guías por marca y modelo.", close: "Cerrar resultados",
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
    <section className={directoryOnly ? styles.directoryHero : styles.hero} aria-labelledby="lab-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span/>{directoryOnly ? c.catalog : h.eyebrow}</p>
        <h1 id="lab-title">{directoryOnly ? c.directory : <>{h.title}<br/><span>{h.accent}</span></>}</h1>
        <p className={styles.intro}>{directoryOnly ? c.directoryDesc : h.intro}</p>
        {!directoryOnly && <div className={styles.heroActions}><a href="#device-lab" className={styles.primaryAction}><Wrench size={18}/>{h.start}<ArrowUpRight size={18}/></a><Link href="/tools/device-reports" className={styles.textAction}>{h.explore}<ArrowRight size={17}/></Link></div>}
        {search}
        {directoryOnly ? <div className={styles.searchHints}><span>{c.hint}</span><Link href="/tools/keyboard">{c.keyboard}</Link><Link href="/tools/screen">{c.screen}</Link><Link href="/collections/drivers">{c.drivers}</Link></div> : <nav className={styles.heroQuickLinks} aria-label={h.allDevices}>{DEVICE_PICKS.map(id => { const entry = CATALOG.devices.find(item => item.id === id)!; const Icon = TOOL_ICONS[id] ?? Monitor; return <Link href={entry.href!} key={id}><Icon size={16}/>{entry.title[lang]}<ArrowUpRight size={13}/></Link>; })}</nav>}
      </div>
      {!directoryOnly && <Link href="/collections/devices" className={styles.feature}><div className={styles.featureImage}><Image src={LABORATORY_ART.home.src} alt={LABORATORY_ART.home.alt[lang]} fill priority sizes="(max-width: 600px) 100vw, 42vw"/><span className={styles.featureTag}><span/> DEVICE LAB</span><span className={styles.featureCross}>+</span></div><div className={styles.featureCaption}><div><span>{h.feature}</span><h2>{h.featureTitle}</h2><p>{h.featureMeta}</p></div><span className={styles.roundArrow} aria-label={h.featureLink}><ArrowUpRight size={23}/></span></div></Link>}
    </section>
    {!directoryOnly && <nav className={styles.sectionNav} aria-label={h.navigation}>
      <a href="#device-lab"><span className={styles.sectionNumber}>01</span><div><strong>{h.devices}</strong><p>{h.devicesDesc}</p></div><ArrowRight size={20}/></a>
      <a href="#play-lab"><span className={styles.sectionNumber}>02</span><div><strong>{h.play}</strong><p>{h.playDesc}</p></div><ArrowRight size={20}/></a>
    </nav>}
    <div className={styles.ad}><AdSenseBanner/></div>
    {(directoryOnly || searching) && <section id="collections" className={styles.catalog} aria-labelledby="catalog-title"><div className={styles.sectionHead}><div><p className={styles.eyebrow}>/ {c.catalog}</p><h2 id="catalog-title" tabIndex={-1}>{c.browse}</h2><p>{c.directoryDesc}</p></div>{!directoryOnly && <button type="button" onClick={() => { reset(); setExpanded(false); }}>{h.close}<X size={17}/></button>}</div>
      <div className={styles.filters}><div role="group" aria-label={c.categories}><button type="button" aria-pressed={category==="all"} onClick={()=>setCategory("all")}>{c.all}</button>{COLLECTIONS.map(col=><button type="button" key={col.id} aria-pressed={category===col.id} onClick={()=>setCategory(col.id)}>{col.name[lang]}</button>)}</div>{searching && <label><input type="checkbox" checked={availableOnly} onChange={e=>setAvailableOnly(e.target.checked)}/>{c.available}</label>}</div>
      <p className={styles.resultCount} role="status">{rows.length} {c.results}</p>{rows.length ? <div className={styles.toolGrid}>{rows.map(row=><ToolCard key={`${row.category}-${row.entry.id}`} {...row}/>)}</div> : <div className={styles.empty}><Search size={30}/><h3>{c.no}</h3><p>{c.noDesc}</p><button type="button" onClick={reset}>{c.reset}<ArrowRight size={16}/></button></div>}
    </section>}
    {!directoryOnly && <>
      <section id="device-lab" className={styles.deviceZone} aria-labelledby="device-title">
        <header className={styles.deviceHead}><div><p className={styles.eyebrow}>01 / {h.devices}</p><h2 id="device-title">{h.deviceTitle}</h2><p>{h.deviceIntro}</p><Link className={styles.deviceAction} href="/collections/devices">{h.allDevices}<ArrowUpRight size={17}/></Link></div><div className={styles.deviceArtwork}><Image src={LABORATORY_ART.devices.src} alt={LABORATORY_ART.devices.alt[lang]} fill sizes="(max-width: 600px) 100vw, 32vw"/></div></header>
        <div className={styles.deviceGrid}>{DEVICE_PICKS.map(id => { const entry = CATALOG.devices.find(item => item.id === id); if (!entry?.href) return null; const Icon = TOOL_ICONS[id] ?? Monitor; return <Link href={entry.href} key={id} className={styles.deviceCard}><span className={styles.deviceThumb}>{entry.image ? <Image src={entry.image} alt="" fill sizes="80px"/> : <Icon size={24}/>}</span><div><h3>{entry.title[lang]}</h3><p>{entry.description[lang]}</p></div><ArrowUpRight size={17}/></Link>; })}</div>
        <nav className={styles.supportGrid} aria-label={h.support}>{[{id:"utilities" as const,title:h.utilityTitle,desc:h.utilityDesc,Icon:Wrench},{id:"drivers" as const,title:h.driverTitle,desc:h.driverDesc,Icon:FileDown}].map(({id,title,desc,Icon}) => <Link key={id} href={`/collections/${id}`}><Icon size={22}/><div><h3>{title}</h3><p>{desc}</p></div><ArrowUpRight size={17}/></Link>)}</nav>
        <div className={styles.deviceFoot}><p className={styles.localNote}><ShieldCheck size={15}/>{c.local}</p><Link href="/tools/device-reports"><ClipboardList size={16}/>{c.reports}<ArrowRight size={16}/></Link></div>
      </section>
      <section id="play-lab" className={styles.playZone} aria-labelledby="play-title">
        <span id="games" className={styles.anchor}/>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>02 / {h.play}</p><h2 id="play-title">{h.tests}</h2><p>{h.testsDesc}</p></div><Link href="/collections/mind">{h.allTests}<ArrowUpRight size={17}/></Link></div>
        <div className={`${styles.toolGrid} ${styles.challengeGrid}`}>{MIND_PICKS.map(id => { const entry = CATALOG.mind.find(item => item.id === id); return entry ? <ToolCard key={id} entry={entry} category="mind"/> : null; })}</div>
        <div className={styles.challengeLinks}><Link href="/progress"><Brain size={17}/>{c.progress}<ArrowRight size={15}/></Link><Link href="/leaderboard"><Trophy size={17}/>{c.ranking}<ArrowRight size={15}/></Link></div>
        <section id="fun-tests" className={styles.exploreBlock} aria-labelledby="explore-title">
          <div className={styles.sectionHead}><div><p className={styles.eyebrow}>EXPLORE YOURSELF</p><h2 id="explore-title">{h.discover}</h2><p>{h.discoverDesc}</p></div><Link href="/collections/discover">{h.allFun}<ArrowUpRight size={17}/></Link></div>
          <div className={styles.exploreGrid}>{CATALOG.discover.filter(entry => ["iq", "mbti", "tarot"].includes(entry.id)).map(entry => <ToolCard key={entry.id} entry={entry} category="discover"/>)}</div>
          <Link className={styles.gameBreak} href="/collections/discover#mini-games"><Gamepad2 size={25}/><div><h3>{h.games}</h3><p>{h.gamesDesc}</p></div><span>{h.playGames}<ArrowRight size={17}/></span></Link>
        </section>
      </section>
      <Link href="/collections" className={styles.allTools}><Search size={18}/>{c.browse}<ArrowRight size={18}/></Link>
    </>}
    {directoryOnly && <section className={styles.records} aria-label={c.records}><h2>{c.records}</h2><div>{[{href:"/progress",title:c.progress,desc:c.progressDesc,Icon:Brain},{href:"/tools/device-reports",title:c.reports,desc:c.reportsDesc,Icon:ClipboardList},{href:"/leaderboard",title:c.ranking,desc:c.rankingDesc,Icon:Trophy}].map(({href,title,desc,Icon})=><Link key={href} href={href}><Icon size={22}/><div><h3>{title}</h3><p>{desc}</p></div><ChevronRight size={18}/></Link>)}</div></section>}
  </div>;
}
