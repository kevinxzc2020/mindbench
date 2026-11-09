"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUpRight, AudioLines, Brain, Check, ChevronRight, FileDown, Gamepad2, Grid2X2, Keyboard, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { CATALOG, COLLECTIONS, getCollection, matchesEntry, type CatalogEntry, type Collection, type CollectionId } from "@/lib/collections";
import { AdSenseBanner } from "./AdSenseBanner";
import { HomeMotion, ScrambleText } from "./HomeMotion";
import styles from "./CollectionHub.module.css";

const ICONS = { mind: Brain, devices: Keyboard, drivers: FileDown, audio: AudioLines, discover: Sparkles, play: Gamepad2 };
const COPY = {
  en: {
    eyebrow: "THE MINDBENCH COLLECTION", title: ["KNOW YOUR MIND.", "KNOW YOUR TOOLS."], intro: "A curious mind deserves a good toolkit. Find your next challenge, explore your setup, or try something just for fun.",
    browse: "Explore collections", try: "Try a reaction test", motionOn: "Effects on", motionOff: "Effects off", collection: "Collections", heading: "What brings you here?", subheading: "Choose a collection. Find your next experiment.",
    search: "Search tests, tools or a device model…", searchLabel: "Search the MindBench collection", clear: "Clear search", availableOnly: "Available now", open: "Open collection", planned: "Planned", ready: "Available", official: "Official resource", available: "available", plannedCount: "planned", results: "results", noResults: "No matches yet.", noResultsDesc: "Try another name, or browse a collection below.",
    shortcut: "A good place to start", reaction: "Reaction time", typing: "Typing test", personality: "Personality explorer", daily: "Daily challenge", progress: "Your progress", leaderboard: "Leaderboard", start: "Open", allCollections: "All collections", back: "Back to collections", groups: "Browse this collection", allGroups: "All topics", entries: "Explore the collection", empty: "No available tools in this group yet.", emptyDesc: "Explore the planned tools or choose another collection.", next: "Keep exploring", home: "Home",
    planTitle: "A new collection is taking shape.", planBody: "These tools are planned and aren't available to run yet. Browse what's coming, or explore an available collection.", note: "For fun and self-reflection. These activities are not clinical or certified assessments.", libraryNote: "Starting with Razer Viper V2 Pro. Links open the manufacturer's website; confirm the model and system requirements there.", source: "Razer · official website", planDetails: "View planned features", languageNote: "Official resources may use a different language.",
  },
  zh: {
    eyebrow: "MINDBENCH · 测试与工具合集", title: ["了解你的思维。", "探索你的设备。"], intro: "给好奇心一套工具。挑战自己的反应与记忆，找到设备资料，或者轻松探索一下自己。",
    browse: "浏览全部合集", try: "先测测反应", motionOn: "动效已开启", motionOff: "动效已关闭", collection: "合集", heading: "这次，想探索什么？", subheading: "先选一个合集，再找到适合你的功能。",
    search: "搜索测试、工具或设备型号…", searchLabel: "搜索 MindBench 合集", clear: "清除搜索", availableOnly: "仅看已开放", open: "进入合集", planned: "规划中", ready: "已开放", official: "官方资料", available: "项已开放", plannedCount: "项规划中", results: "个结果", noResults: "暂时没有匹配的内容。", noResultsDesc: "换个关键词，或者从下方合集开始。",
    shortcut: "从这里开始", reaction: "反应时间", typing: "打字测试", personality: "性格探索", daily: "每日挑战", progress: "进步记录", leaderboard: "排行榜", start: "打开", allCollections: "全部合集", back: "返回合集", groups: "浏览本合集", allGroups: "全部分类", entries: "合集内容", empty: "这个分类还没有已开放的工具。", emptyDesc: "可以先查看规划中的功能，或探索其他已开放的合集。", next: "继续探索", home: "首页",
    planTitle: "新的合集，正在规划。", planBody: "以下功能尚未上线，目前不能运行。你可以先了解功能范围，或进入已经开放的合集。", note: "供娱乐与自我探索，不属于临床诊断或认证测评。", libraryNote: "先从 Razer Viper V2 Pro 开始。链接会打开厂商官网，请在官网确认型号和系统要求。", source: "Razer · 官方网站", planDetails: "查看规划内容", languageNote: "官方资料的语言可能与本站不同。",
  },
  es: {
    eyebrow: "LA COLECCIÓN MINDBENCH", title: ["CONOCE TU MENTE.", "EXPLORA TU EQUIPO."], intro: "Herramientas para una mente curiosa. Pon a prueba tus reflejos y memoria, encuentra recursos o descubre algo sobre ti.",
    browse: "Explorar colecciones", try: "Probar mis reflejos", motionOn: "Efectos activados", motionOff: "Efectos desactivados", collection: "Colecciones", heading: "¿Qué quieres explorar?", subheading: "Elige una colección y encuentra tu próximo experimento.",
    search: "Busca pruebas, herramientas o un modelo…", searchLabel: "Buscar en MindBench", clear: "Borrar búsqueda", availableOnly: "Disponibles", open: "Abrir colección", planned: "Previsto", ready: "Disponible", official: "Recurso oficial", available: "disponibles", plannedCount: "previstos", results: "resultados", noResults: "Todavía no hay coincidencias.", noResultsDesc: "Prueba otro nombre o explora las colecciones.",
    shortcut: "Un buen punto de partida", reaction: "Tiempo de reacción", typing: "Mecanografía", personality: "Personalidad", daily: "Reto diario", progress: "Tu progreso", leaderboard: "Clasificación", start: "Abrir", allCollections: "Todas las colecciones", back: "Volver a las colecciones", groups: "Explorar esta colección", allGroups: "Todos los temas", entries: "Contenido de la colección", empty: "Todavía no hay herramientas disponibles en este grupo.", emptyDesc: "Explora las herramientas previstas o elige otra colección.", next: "Sigue explorando", home: "Inicio",
    planTitle: "Una nueva colección está tomando forma.", planBody: "Estas herramientas están previstas y aún no se pueden utilizar. Explora los planes o visita una colección disponible.", note: "Para divertirse y reflexionar. No son evaluaciones clínicas ni certificadas.", libraryNote: "Empezamos por Razer Viper V2 Pro. Los enlaces abren la web del fabricante; confirma allí el modelo y los requisitos del sistema.", source: "Razer · sitio oficial", planDetails: "Ver funciones previstas", languageNote: "Los recursos oficiales pueden estar en otro idioma.",
  },
};

function CollectionArtwork({ collection, priority = false }: { collection: Collection; priority?: boolean }) {
  if (collection.image) return <Image src={collection.image} alt="" fill priority={priority} sizes="(max-width: 600px) 100vw, (max-width: 980px) 50vw, 33vw" className={styles.artPhoto} />;
  if (collection.id === "drivers") return <div className={styles.libraryArt} aria-hidden="true"><span className={styles.fileBack} /><span className={styles.fileFront}><FileDown size={48} strokeWidth={1} /><i /><i /><i /><small>DEVICE LIBRARY</small></span><span className={styles.fileTab}>. /</span></div>;
  return <div className={styles.audioArt} aria-hidden="true"><span className={styles.audioCircle} /><div className={styles.wave}>{Array.from({ length: 49 }, (_, i) => <i key={i} style={{ height: `${(12 + Math.abs(Math.sin(i * .47)) * Math.sin((i + 1) / 50 * Math.PI) * 94).toFixed(2)}%`, animationDelay: `${(i * -.035).toFixed(3)}s` }} />)}</div><span className={styles.audioCaption}>VOICE / SOUND / PLAY</span></div>;
}

function CollectionCard({ collection, index }: { collection: Collection; index: number }) {
  const { lang } = useLang(); const c = COPY[lang];
  const Icon = ICONS[collection.id];
  const ready = CATALOG[collection.id].filter(e => e.href).length;
  return <Link href={`/collections/${collection.id}`} className={styles.collectionCard} data-motion-card>
    <div className={styles.collectionVisual}><CollectionArtwork collection={collection} /><div className={styles.imageShade} /><span className={styles.cardIndex}>{String(index + 1).padStart(2, "0")} / <Icon size={15} /></span><span className={`${styles.badge} ${!ready ? styles.plannedBadge : ""}`}>{ready ? `${ready} ${c.available}` : c.planned}</span></div>
    <div className={styles.collectionCopy}><p className={styles.topics}>{collection.topics[lang]}</p><div className={styles.cardTitle}><h3>{collection.name[lang]}</h3><ArrowUpRight size={24} /></div><p>{collection.description[lang]}</p><span className={styles.cardAction}>{ready ? c.open : c.planDetails}<ChevronRight size={15} /></span></div>
  </Link>;
}

function EntryCard({ entry, collection }: { entry: CatalogEntry; collection?: Collection }) {
  const { lang } = useLang(); const c = COPY[lang];
  const content = <>
    {entry.image && <div className={styles.entryImage}><Image src={entry.image} alt="" fill sizes="(max-width: 650px) 100vw, (max-width: 1100px) 50vw, 33vw" /></div>}
    <div className={styles.entryBody}><div className={styles.entryMeta}><span>{collection ? collection.name[lang] : entry.group[lang]}</span><span className={!entry.href ? styles.plannedText : styles.readyText}>{entry.external ? c.official : entry.href ? c.ready : c.planned}</span></div><h3>{entry.title[lang]}</h3><p>{entry.description[lang]}</p>{entry.href ? <span className={styles.entryAction}>{entry.external ? c.source : c.start}<ArrowUpRight size={17} /></span> : <span className={styles.plannedFooter}>{c.planned}</span>}</div>
  </>;
  if (entry.href && entry.external) return <a className={styles.entryCard} href={entry.href} target="_blank" rel="noopener noreferrer">{content}</a>;
  if (entry.href) return <Link className={styles.entryCard} href={entry.href}>{content}</Link>;
  return <article className={`${styles.entryCard} ${styles.plannedCard}`}>{content}</article>;
}

function SearchField({ value, onChange, id }: { value: string; onChange: (value: string) => void; id: string }) {
  const { lang } = useLang(); const c = COPY[lang];
  return <div className={styles.search}><Search size={19} aria-hidden="true" /><label htmlFor={id} className="sr-only">{c.searchLabel}</label><input id={id} type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={c.search} autoComplete="off" />{value && <button type="button" onClick={() => onChange("")} aria-label={c.clear}><X size={17} /></button>}</div>;
}

export function CollectionHub({ directoryOnly = false }: { directoryOnly?: boolean }) {
  const { lang } = useLang(); const c = COPY[lang];
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const searching = Boolean(query.trim());
  const collections = COLLECTIONS.filter(col => !availableOnly || CATALOG[col.id].some(e => e.href));
  const results = COLLECTIONS.flatMap(collection => CATALOG[collection.id].filter(e => matchesEntry(e, query) && (!availableOnly || e.href)).map(entry => ({ entry, collection })));
  const body = <div className={styles.shell}>
    {!directoryOnly && <>
      <section className={`studio-hero ${styles.hero}`} aria-labelledby="hub-title">
        <Image className={`studio-hero-image ${styles.heroImage}`} src="/images/arcade-still-life-v2.png" fill priority alt="" sizes="100vw" />
        <canvas className="studio-pixel-canvas" aria-hidden="true" /><div className="studio-image-trail" aria-hidden="true" /><div className={`studio-hero-shade ${styles.heroShade}`} />
        <div className={`studio-hero-content ${styles.heroContent}`}><p className={styles.eyebrow}><span />{c.eyebrow}</p><h1 id="hub-title" data-motion-heading data-scramble-trigger>{c.title.map(line => <ScrambleText key={line} text={line} />)}</h1><p className={styles.heroIntro}>{c.intro}</p><div className={styles.heroActions}><a href="#collections" className={styles.primary}>{c.browse}<ArrowDown size={17} /></a><Link href="/games/reaction-time" className={styles.textLink}>{c.try}<ArrowUpRight size={16} /></Link></div></div>
        <div className={styles.heroFoot}><span>MINDBENCH / TEST. CHECK. EXPLORE.</span><button type="button" aria-pressed={motionEnabled} onClick={() => setMotionEnabled(v => !v)}>{motionEnabled ? c.motionOn : c.motionOff}</button></div>
      </section>
      <nav className={styles.shortcuts} aria-label={c.shortcut}><span>{c.shortcut}<ArrowUpRight size={14} /></span><Link href="/games/reaction-time">{c.reaction}</Link><Link href="/games/typing-test">{c.typing}</Link><Link href="/mbti">{c.personality}</Link><Link href="/daily">{c.daily}</Link></nav>
      <div className="studio-ad-band"><AdSenseBanner /></div>
    </>}
    <section id="collections" className={styles.directory} aria-labelledby="collections-title">
      <span id="games" className={styles.legacyAnchor} />
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>/ {c.collection}</p>{directoryOnly ? <h1 id="collections-title">{c.heading}</h1> : <h2 id="collections-title">{c.heading}</h2>}<p>{c.subheading}</p></div><span className={styles.directoryNumber}>{String(COLLECTIONS.length).padStart(2, "0")}<Grid2X2 size={20} /></span></div>
      <div className={styles.toolbar}><SearchField value={query} onChange={setQuery} id="hub-search" /><button type="button" className={styles.filterButton} aria-pressed={availableOnly} onClick={() => setAvailableOnly(v => !v)}>{availableOnly ? <Check size={16} /> : <SlidersHorizontal size={16} />}{c.availableOnly}</button></div>
      <div className={styles.resultsSummary} role="status" aria-live="polite">{searching ? `${results.length} ${c.results}` : `${collections.length} ${c.collection}`}</div>
      {searching ? results.length ? <div className={styles.entryGrid}>{results.map(({ entry, collection }) => <EntryCard key={`${collection.id}-${entry.id}`} entry={entry} collection={collection} />)}</div> : <div className={styles.empty}><Search size={28} /><h3>{c.noResults}</h3><p>{c.noResultsDesc}</p><button onClick={() => setQuery("")}>{c.clear}<ArrowUpRight size={16} /></button></div> : <div className={styles.collectionGrid}>{collections.map(col => <CollectionCard key={col.id} collection={col} index={COLLECTIONS.indexOf(col)} />)}</div>}
      {searching && <div className={styles.browseLinks}>{COLLECTIONS.map(col => <Link key={col.id} href={`/collections/${col.id}`}>{col.name[lang]}<ArrowUpRight size={14} /></Link>)}</div>}
    </section>
    <div className={styles.progressBand}><div><p className={styles.eyebrow}>MINDBENCH / KEEP GOING</p><p>{lang === "zh" ? "每一次尝试，都能多了解一点自己。" : lang === "es" ? "Cada intento te ayuda a conocerte un poco más." : "Every attempt tells you a little more."}</p></div><Link href="/progress">{c.progress}<ArrowUpRight size={18} /></Link><Link href="/leaderboard">{c.leaderboard}<ArrowUpRight size={18} /></Link></div>
  </div>;
  return directoryOnly ? body : <HomeMotion language={lang} category={`${searching}:${availableOnly}`} enabled={motionEnabled}>{body}</HomeMotion>;
}

export function CollectionDetail({ id }: { id: CollectionId }) {
  const collection = getCollection(id)!;
  const { lang } = useLang(); const c = COPY[lang];
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const entries = CATALOG[id];
  const groups = Array.from(new Map(entries.map(e => [e.group.en, e.group])).entries());
  const ready = entries.filter(e => e.href).length;
  const filtered = entries.filter(e => (activeGroup === "all" || activeGroup === e.group.en) && (!availableOnly || e.href) && matchesEntry(e, query));
  const Icon = ICONS[id];
  return <div className={`${styles.shell} ${styles.detail}`}>
    <nav className={styles.breadcrumb} aria-label={c.back}><Link href="/">{c.home}</Link><ChevronRight size={13} /><Link href="/collections">{c.collection}</Link><ChevronRight size={13} /><span aria-current="page">{collection.name[lang]}</span></nav>
    <header className={styles.detailHero}><div><p className={styles.eyebrow}><Icon size={16} />{collection.topics[lang]}</p><h1>{collection.name[lang]}</h1><p>{collection.description[lang]}</p><div className={styles.detailStats}>{ready > 0 && <span><i />{ready} {c.available}</span>}{ready < entries.length && <span>{entries.length - ready} {c.plannedCount}</span>}<Link href="/collections">{c.allCollections}<ArrowUpRight size={14} /></Link></div></div><div className={styles.detailArtwork}><CollectionArtwork collection={collection} priority /></div></header>
    {ready === 0 && <aside className={styles.notice}><span className={styles.plannedBadge}>{c.planned}</span><div><h2>{c.planTitle}</h2><p>{c.planBody}</p></div><Link href="/collections/mind">{COLLECTIONS[0].name[lang]}<ArrowUpRight size={16} /></Link></aside>}
    {id === "discover" && <p className={styles.contextNote}>{c.note}</p>}
    {id === "drivers" && <p className={styles.contextNote}>{c.libraryNote} {c.languageNote}</p>}
    <div className={styles.detailLayout}>
      <aside className={styles.sidebar}><nav aria-label={c.groups}><p className={styles.eyebrow}>{c.groups}</p><button type="button" aria-pressed={activeGroup === "all"} onClick={() => setActiveGroup("all")}>{c.allGroups}<span>{entries.length}</span></button>{groups.map(([key, label]) => <button type="button" key={key} aria-pressed={activeGroup === key} onClick={() => setActiveGroup(key)}>{label[lang]}<span>{entries.filter(e => e.group.en === key).length}</span></button>)}</nav><Link className={styles.backLink} href="/collections"><ArrowLeft size={14} />{c.back}</Link></aside>
      <section className={styles.detailResults} aria-label={c.entries}><div className={styles.toolbar}><SearchField value={query} onChange={setQuery} id="collection-search" /><button type="button" className={styles.filterButton} aria-pressed={availableOnly} onClick={() => setAvailableOnly(v => !v)}>{availableOnly ? <Check size={16} /> : <SlidersHorizontal size={16} />}{c.availableOnly}</button></div><p className={styles.resultsSummary} role="status" aria-live="polite">{filtered.length} {c.results}</p>{filtered.length ? <div className={`${styles.entryGrid} ${styles.detailGrid}`}>{filtered.map(entry => <EntryCard entry={entry} key={entry.id} />)}</div> : <div className={styles.empty}><Search size={28} /><h2>{query.trim() ? c.noResults : c.empty}</h2><p>{query.trim() ? c.noResultsDesc : c.emptyDesc}</p><button type="button" onClick={() => { setQuery(""); setAvailableOnly(false); setActiveGroup("all"); }}>{c.allGroups}<ArrowUpRight size={16} /></button></div>}</section>
    </div>
    <section className={styles.related}><p className={styles.eyebrow}>{c.next}</p><div>{COLLECTIONS.filter(col => col.id !== id).map(col => { const RelatedIcon = ICONS[col.id]; return <Link href={`/collections/${col.id}`} key={col.id}><RelatedIcon size={19} /><span>{col.name[lang]}</span><ArrowUpRight size={17} /></Link>; })}</div></section>
  </div>;
}
