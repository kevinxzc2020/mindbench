"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Wrench, Brain, Check, ChevronRight, FileDown, Keyboard, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { CATALOG, COLLECTIONS, getCollection, matchesEntry, type CatalogEntry, type Collection, type CollectionId } from "@/lib/collections";
import { LaboratoryHome, TOOL_ICONS } from "./LaboratoryHome";
import styles from "./CollectionHub.module.css";

const ICONS = { mind: Brain, devices: Keyboard, drivers: FileDown, utilities: Wrench, discover: Sparkles };
const COPY = {
  en: {
    eyebrow: "THE MINDBENCH COLLECTION", title: ["KNOW YOUR MIND.", "KNOW YOUR TOOLS."], intro: "Test your abilities, check your devices, find useful tools and official drivers — or explore something just for fun.",
    browse: "Explore collections", try: "Check a device", motionOn: "Effects on", motionOff: "Effects off", collection: "Collections", heading: "What brings you here?", subheading: "Choose a collection. Find your next experiment.",
    search: "Search tests, tools or a device model…", searchLabel: "Search the MindBench collection", clear: "Clear search", availableOnly: "Available now", open: "Open collection", planned: "Planned", ready: "Available", official: "Official resource", available: "available", plannedCount: "planned", results: "results", noResults: "No matches yet.", noResultsDesc: "Try another name, or browse a collection below.",
    shortcut: "A good place to start", reaction: "Reaction time", typing: "Keyboard tester", record: "Record audio", drivers: "Find a driver", reports: "Checkup history", personality: "Personality explorer", daily: "Daily challenge", progress: "Your progress", leaderboard: "Leaderboard", start: "Open", allCollections: "All collections", back: "Back to collections", groups: "Browse this collection", allGroups: "All topics", entries: "Explore the collection", empty: "No available tools in this group yet.", emptyDesc: "Explore the planned tools or choose another collection.", next: "Keep exploring", home: "Home",
    planTitle: "A new collection is taking shape.", planBody: "These tools are planned and aren't available to run yet. Browse what's coming, or explore an available collection.", note: "For fun and self-reflection. These activities are not clinical or certified assessments.", libraryNote: "Starting with Razer Viper V2 Pro. Links open the manufacturer's website; confirm the model and system requirements there.", source: "Razer · official website", planDetails: "View planned features", languageNote: "Official resources may use a different language.",
  },
  zh: {
    eyebrow: "MINDBENCH · 测试与工具合集", title: ["了解你的思维。", "探索你的设备。"], intro: "测能力、查设备、用工具、找驱动。想放松时，再来一场趣味测试或小游戏。",
    browse: "浏览全部合集", try: "开始设备自检", motionOn: "动效已开启", motionOff: "动效已关闭", collection: "合集", heading: "这次，想探索什么？", subheading: "先选一个合集，再找到适合你的功能。",
    search: "搜索测试、工具或设备型号…", searchLabel: "搜索 MindBench 合集", clear: "清除搜索", availableOnly: "仅看已开放", open: "进入合集", planned: "规划中", ready: "已开放", official: "官方资料", available: "项已开放", plannedCount: "项规划中", results: "个结果", noResults: "暂时没有匹配的内容。", noResultsDesc: "换个关键词，或者从下方合集开始。",
    shortcut: "从这里开始", reaction: "反应时间", typing: "键盘检测", record: "录音回放", drivers: "查找驱动", reports: "自检记录", personality: "性格探索", daily: "每日挑战", progress: "进步记录", leaderboard: "排行榜", start: "打开", allCollections: "全部合集", back: "返回合集", groups: "浏览本合集", allGroups: "全部分类", entries: "合集内容", empty: "这个分类还没有已开放的工具。", emptyDesc: "可以先查看规划中的功能，或探索其他已开放的合集。", next: "继续探索", home: "首页",
    planTitle: "新的合集，正在规划。", planBody: "以下功能尚未上线，目前不能运行。你可以先了解功能范围，或进入已经开放的合集。", note: "供娱乐与自我探索，不属于临床诊断或认证测评。", libraryNote: "先从 Razer Viper V2 Pro 开始。链接会打开厂商官网，请在官网确认型号和系统要求。", source: "Razer · 官方网站", planDetails: "查看规划内容", languageNote: "官方资料的语言可能与本站不同。",
  },
  es: {
    eyebrow: "LA COLECCIÓN MINDBENCH", title: ["CONOCE TU MENTE.", "EXPLORA TU EQUIPO."], intro: "Pon a prueba tus capacidades y dispositivos, encuentra herramientas y controladores, o explora algo por diversión.",
    browse: "Explorar colecciones", try: "Revisar un dispositivo", motionOn: "Efectos activados", motionOff: "Efectos desactivados", collection: "Colecciones", heading: "¿Qué quieres explorar?", subheading: "Elige una colección y encuentra tu próximo experimento.",
    search: "Busca pruebas, herramientas o un modelo…", searchLabel: "Buscar en MindBench", clear: "Borrar búsqueda", availableOnly: "Disponibles", open: "Abrir colección", planned: "Previsto", ready: "Disponible", official: "Recurso oficial", available: "disponibles", plannedCount: "previstos", results: "resultados", noResults: "Todavía no hay coincidencias.", noResultsDesc: "Prueba otro nombre o explora las colecciones.",
    shortcut: "Un buen punto de partida", reaction: "Tiempo de reacción", typing: "Probar teclado", record: "Grabar audio", drivers: "Buscar controladores", reports: "Historial de dispositivos", personality: "Personalidad", daily: "Reto diario", progress: "Tu progreso", leaderboard: "Clasificación", start: "Abrir", allCollections: "Todas las colecciones", back: "Volver a las colecciones", groups: "Explorar esta colección", allGroups: "Todos los temas", entries: "Contenido de la colección", empty: "Todavía no hay herramientas disponibles en este grupo.", emptyDesc: "Explora las herramientas previstas o elige otra colección.", next: "Sigue explorando", home: "Inicio",
    planTitle: "Una nueva colección está tomando forma.", planBody: "Estas herramientas están previstas y aún no se pueden utilizar. Explora los planes o visita una colección disponible.", note: "Para divertirse y reflexionar. No son evaluaciones clínicas ni certificadas.", libraryNote: "Empezamos por Razer Viper V2 Pro. Los enlaces abren la web del fabricante; confirma allí el modelo y los requisitos del sistema.", source: "Razer · sitio oficial", planDetails: "Ver funciones previstas", languageNote: "Los recursos oficiales pueden estar en otro idioma.",
  },
};

function CollectionArtwork({ collection, priority = false }: { collection: Collection; priority?: boolean }) {
  const { lang } = useLang();
  return <Image src={collection.image} alt={collection.imageAlt[lang]} fill priority={priority} sizes="(max-width: 760px) 100vw, 40vw" className={styles.artPhoto} />;
}

function EntryCard({ entry, collection }: { entry: CatalogEntry; collection?: Collection }) {
  const { lang } = useLang(); const c = COPY[lang];
  const Icon = TOOL_ICONS[entry.id] ?? Wrench;
  const content = <>
    {entry.image && <div className={styles.entryImage}><Image src={entry.image} alt="" fill sizes="(max-width: 650px) 100vw, (max-width: 1100px) 50vw, 33vw" /></div>}
    {!entry.image && <div className={styles.entryIcon}><Icon size={25} strokeWidth={1.6}/></div>}
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
  return <LaboratoryHome directoryOnly={directoryOnly} />;
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
      <section className={styles.detailResults} aria-label={c.entries}><div className={styles.toolbar}><SearchField value={query} onChange={setQuery} id="collection-search" /><button type="button" className={styles.filterButton} aria-pressed={availableOnly} onClick={() => setAvailableOnly(v => !v)}>{availableOnly ? <Check size={16} /> : <SlidersHorizontal size={16} />}{c.availableOnly}</button></div><p className={styles.resultsSummary} role="status" aria-live="polite">{filtered.length} {c.results}</p>{filtered.length ? <div>{(id === "discover" && activeGroup === "all" ? groups : [["results", null]] as const).map(([key, label]) => {
          const sectionEntries = label ? filtered.filter(entry => entry.group.en === key) : filtered;
          return sectionEntries.length ? <section key={key} className={styles.topicSection}>{label && <h2 className={styles.topicHeading}>{label[lang]}<span>{sectionEntries.length}</span></h2>}<div className={`${styles.entryGrid} ${styles.detailGrid}`}>{sectionEntries.map(entry => <EntryCard entry={entry} key={entry.id} />)}</div></section> : null;
        })}</div> : <div className={styles.empty}><Search size={28} /><h2>{query.trim() ? c.noResults : c.empty}</h2><p>{query.trim() ? c.noResultsDesc : c.emptyDesc}</p><button type="button" onClick={() => { setQuery(""); setAvailableOnly(false); setActiveGroup("all"); }}>{c.allGroups}<ArrowUpRight size={16} /></button></div>}</section>
    </div>
    <section className={styles.related}><p className={styles.eyebrow}>{c.next}</p><div>{COLLECTIONS.filter(col => col.id !== id).map(col => { const RelatedIcon = ICONS[col.id]; return <Link href={`/collections/${col.id}`} key={col.id}><RelatedIcon size={19} /><span>{col.name[lang]}</span><ArrowUpRight size={17} /></Link>; })}</div></section>
  </div>;
}
