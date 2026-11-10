"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, ChevronRight, FileDown, Mouse, Search } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { LABORATORY_ART } from "@/lib/laboratory-art";
import { DRIVER_DEVICES, driverPath, filterDrivers, isOfficialDriverUrl, type DriverDevice, type DriverResource } from "@/lib/driver-library";
import styles from "./DriverLibrary.module.css";

function useCopy() {
  const { lang } = useLang();
  return { lang, t: (en: string, zh: string, es: string) => lang === "zh" ? zh : lang === "es" ? es : en };
}
function useCategories() {
  const { t } = useCopy();
  return { mouse: t("Mice", "鼠标", "Ratones"), keyboard: t("Keyboards", "键盘", "Teclados"), audio: t("Audio", "音频设备", "Audio"), controller: t("Controllers", "手柄", "Mandos"), display: t("Displays", "显示器", "Pantallas") };
}
function useKinds() {
  const { t } = useCopy();
  return { downloads: t("Downloads", "下载目录", "Descargas"), software: t("Configuration software", "配置软件", "Software"), firmware: t("Firmware", "固件", "Firmware"), support: t("Manuals & support", "说明与支持", "Manuales y soporte") };
}
function Breadcrumbs({ device }: { device?: DriverDevice }) {
  const { t } = useCopy();
  return <nav className={styles.breadcrumbs} aria-label={t("Breadcrumbs", "当前位置", "Ruta de navegación")}><Link href="/collections">{t("Collections", "全部合集", "Colecciones")}</Link><ChevronRight size={13}/>{device ? <><Link href="/collections/drivers">{t("Device library", "驱动资料库", "Biblioteca de dispositivos")}</Link><ChevronRight size={13}/><span aria-current="page">{device.brandName.en} / {device.name}</span></> : <span aria-current="page">{t("Device library", "驱动资料库", "Biblioteca de dispositivos")}</span>}</nav>;
}
function OfficialLink({ device, url, children, primary = false }: { device: DriverDevice; url: string; children: React.ReactNode; primary?: boolean }) {
  if (!isOfficialDriverUrl(device, url)) return null;
  return <a href={url} target="_blank" rel="noopener noreferrer" className={primary ? styles.primary : undefined}>{children}<ArrowUpRight size={16} aria-hidden="true"/></a>;
}

export function DriverLibrary() {
  const { lang, t } = useCopy(); const categories = useCategories(); const kinds = useKinds();
  const [query, setQuery] = useState(""), [brand, setBrand] = useState("all"), [category, setCategory] = useState("all");
  const brands = Array.from(new Map(DRIVER_DEVICES.map(d => [d.brand, d.brandName])).entries());
  const availableCategories = Array.from(new Set(DRIVER_DEVICES.map(d => d.category)));
  const devices = filterDrivers(query, brand, category);
  return <div className={styles.shell}>
    <Breadcrumbs/>
    <header className={`${styles.hero} ${styles.libraryHero}`}><div><p className={styles.eyebrow}><FileDown size={17}/> MINDBENCH / DEVICE LIBRARY</p><h1>{t("Find your device.\nGet the right software.", "找到设备，再找对软件。", "Tu dispositivo.\nSu software oficial.")}</h1><p className={styles.intro}>{t("Browse by brand and model to reach the manufacturer's downloads, firmware and support. Start with the model name or code on your device.", "按品牌与型号找到官方软件下载、固件和使用说明。从设备上的型号名称或代码开始查找。", "Busca por marca y modelo para encontrar descargas, firmware y ayuda del fabricante. Empieza por el nombre o código de tu dispositivo.")}</p><div className={styles.summary}><span>{brands.length} {t("brand", "个品牌", "marca")}</span><span>{DRIVER_DEVICES.length} {t("model listed", "款已收录型号", "modelo incluido")}</span><span>{t("Manufacturer links", "厂商官方下载入口", "Enlaces del fabricante")}</span></div></div><div className={styles.libraryArtwork}><Image src={LABORATORY_ART.drivers.src} alt={LABORATORY_ART.drivers.alt[lang]} fill priority sizes="(max-width: 760px) 100vw, 40vw"/></div></header>
    <div className={styles.layout}>
      <aside className={styles.sidebar}><h2>{t("Browse brands", "按品牌查找", "Explorar marcas")}</h2><nav aria-label={t("Brand filter", "品牌筛选", "Filtro de marca")}><button className={styles.brand} aria-pressed={brand === "all"} onClick={() => setBrand("all")}>{t("All brands", "全部品牌", "Todas las marcas")}<span>{DRIVER_DEVICES.length}</span></button>{brands.map(([id, name]) => <button key={id} className={styles.brand} aria-pressed={brand === id} onClick={() => setBrand(id)}>{name[lang]}<span>{DRIVER_DEVICES.filter(d => d.brand === id).length}</span></button>)}</nav><p>{t("Starting with Viper V2 Pro. Only listed models appear in search; more models can be added as their sources are reviewed.", "首批收录 Viper V2 Pro。搜索范围为已收录型号，后续核对官方资料后逐步补充。", "Empezamos por Viper V2 Pro. La búsqueda cubre los modelos incluidos; se añadirán más tras revisar sus fuentes.")}</p></aside>
      <section className={styles.results} aria-label={t("Device models", "设备型号", "Modelos")}>
        <div className={styles.filters}><label className={styles.field}>{t("Model name or code", "型号名称或代码", "Nombre o código del modelo")}<span className={styles.search}><Search size={18}/><input type="search" autoComplete="off" value={query} onChange={e => setQuery(e.target.value)} placeholder="Viper V2 Pro / RZ01-04390"/></span></label><label className={styles.field}>{t("Device type", "设备类别", "Tipo de dispositivo")}<select value={category} onChange={e => setCategory(e.target.value)}><option value="all">{t("All types", "全部类别", "Todos los tipos")}</option>{availableCategories.map(id => <option key={id} value={id}>{categories[id]}</option>)}</select></label></div>
        <p className={styles.count} role="status" aria-live="polite">{devices.length} {t("matching models", "个匹配型号", "modelos encontrados")}</p>
        {devices.map(device => <article className={styles.model} key={driverPath(device)}><div className={styles.modelHead}><div><p className={styles.eyebrow}>{device.brandName[lang]} / {categories[device.category]}</p><h2><Link href={driverPath(device)}>{device.name}</Link></h2><p className={styles.modelCode}>{t("Model", "型号代码", "Modelo")} · {device.modelCode}</p></div><Mouse size={45} strokeWidth={1} aria-hidden="true"/></div><p>{device.description[lang]}</p><div className={styles.tags}>{device.resources.map(resource => <span key={resource.id} className={styles.tag}>{kinds[resource.kind]}</span>)}</div><div className={styles.actions}><Link className={styles.primary} href={driverPath(device)}>{t("View model resources", "查看型号资料", "Ver recursos del modelo")}<ArrowUpRight size={16}/></Link><OfficialLink device={device} url={device.resources.find(r => r.kind === "downloads")!.url}>{t("Open official downloads", "打开官方下载页", "Abrir descargas oficiales")}</OfficialLink></div><p className={styles.fine}>{t("Sources reviewed", "资料核对", "Fuentes revisadas")} · {device.reviewedAt}</p></article>)}
        {!devices.length && <div className={styles.empty}><h2>{t("No matching model yet", "暂未收录匹配型号", "No hay un modelo coincidente")}</h2><p>{t("Try the exact model or its code. This does not mean the manufacturer has no driver for your device.", "试试完整型号或设备代码。没有搜索结果不代表厂商没有对应驱动。", "Prueba el modelo exacto o su código. No encontrarlo aquí no significa que el fabricante no tenga un controlador.")}</p><button className={styles.reset} onClick={() => { setQuery(""); setBrand("all"); setCategory("all"); }}>{t("Clear filters", "清除筛选", "Borrar filtros")}</button></div>}
        <p className={`${styles.fine} ${styles.note}`}>{t("Links open the manufacturer's website in a new tab. MindBench is an independent directory; downloads are provided by the manufacturer. Versions and requirements are maintained on the official pages.", "外链会在新标签页打开厂商官网。MindBench 是独立资料目录，下载文件由厂商提供，版本与系统要求以官方页面为准。", "Los enlaces abren la web del fabricante en otra pestaña. MindBench es un directorio independiente; el fabricante proporciona los archivos, las versiones y los requisitos.")}</p>
      </section>
    </div>
  </div>;
}

function ResourceCard({ resource, device }: { resource: DriverResource; device: DriverDevice }) {
  const { lang, t } = useCopy(); const kinds = useKinds();
  return <article className={styles.resource}><span className={styles.eyebrow}>{kinds[resource.kind]}</span><h3>{resource.title[lang]}</h3><p>{resource.description[lang]}</p><div className={styles.actions}><OfficialLink device={device} url={resource.url} primary>{t("Open official page", "打开官方页面", "Abrir página oficial")}</OfficialLink></div>{resource.related && <div className={styles.related}>{resource.related.map(link => <OfficialLink key={link.url} device={device} url={link.url}>{link.label[lang]}</OfficialLink>)}</div>}<div className={styles.source}>{t("Source", "来源", "Fuente")}: {resource.sourceTitle}<br/>{new URL(resource.url).hostname}{resource.sourceUpdated && <><br/>{t("Source updated", "来源页面更新", "Fuente actualizada")}: {resource.sourceUpdated}</>}</div></article>;
}

export function DriverModel({ device }: { device: DriverDevice }) {
  const { lang, t } = useCopy(); const categories = useCategories();
  return <div className={styles.shell}>
    <Breadcrumbs device={device}/>
    <header className={styles.hero}><div><p className={styles.eyebrow}>{device.brandName[lang]} / {categories[device.category]}</p><h1>{device.name}</h1><p className={styles.modelCode}>{t("Exact model code", "对应型号代码", "Código de modelo")} · {device.modelCode}</p><p className={styles.intro}>{device.description[lang]}</p><div className={styles.actions}><OfficialLink device={device} url={device.resources.find(r => r.kind === "downloads")!.url} primary>{t("Open official downloads", "打开官方下载页", "Abrir descargas oficiales")}</OfficialLink></div><div className={styles.summary}><span>{t("Sources reviewed", "资料核对", "Fuentes revisadas")} · {device.reviewedAt}</span><Link href="/collections/drivers"><ArrowLeft size={13} style={{display:"inline"}}/> {t("All models", "返回型号列表", "Todos los modelos")}</Link></div></div><div className={styles.stamp} aria-hidden="true"><Mouse size={64} strokeWidth={1}/><span>{device.modelCode}</span></div></header>
    <div className={styles.guide}><div><strong>{t("01 / Match your model", "01 / 核对型号", "01 / Confirma el modelo")}</strong><p className={styles.fine}>{t("Compare the code on the device or packaging with the model above. Similar product names can have different downloads.", "对照设备或包装上的型号代码。相似名称的产品可能使用不同下载文件。", "Compara el código del dispositivo o embalaje. Los nombres parecidos pueden corresponder a archivos distintos.")}</p></div><div><strong>{t("02 / Choose what you need", "02 / 选择用途", "02 / Elige el recurso")}</strong><p className={styles.fine}>{t("Configuration software changes settings. Firmware updates the device. Setup and troubleshooting instructions are separate resources.", "配置软件用于调整设置，固件用于更新设备；连接说明与排障资料另列入口。", "El software configura; el firmware actualiza el dispositivo. Las guías de uso y ayuda tienen su propia entrada.")}</p></div><div><strong>{t("03 / Continue on the official site", "03 / 前往官方下载", "03 / Continúa en la web oficial")}</strong><p className={styles.fine}>{t("Confirm the operating system, supported devices and update steps on Razer's page before downloading.", "下载前在 Razer 页面确认操作系统、适用设备与更新步骤。", "Confirma el sistema operativo, dispositivos y pasos en la página de Razer antes de descargar.")}</p></div></div>
    <h2 className={styles.sectionTitle}>{t("Official resources", "官方资源", "Recursos oficiales")}</h2><p className={styles.fine}>{t("All buttons below open Razer pages in a new tab. Versions are intentionally left to the official pages, so you can check the current release there.", "下方按钮均在新标签页打开 Razer 官方页面，请在官方页面查看当前版本。", "Los botones abren páginas de Razer en otra pestaña. Consulta allí las versiones actuales.")}</p>
    <div className={styles.resourceGrid}>{device.resources.map(resource => <ResourceCard key={resource.id} resource={resource} device={device}/>)}</div>
    <section className={styles.note}><h2 className={styles.sectionTitle}>{t("Check your device after setup", "设置完成后，检查设备表现", "Comprueba tu dispositivo después")}</h2><p className={styles.fine}>{t("Return to MindBench to inspect browser input. These checks do not confirm a driver installation or read the installed firmware version.", "回到 MindBench 检查网页收到的输入。这些检测不能确认驱动是否安装成功，也不会读取已安装的固件版本。", "Vuelve a MindBench para observar las entradas del navegador. Estas pruebas no confirman la instalación ni leen la versión del firmware.")}</p><div className={styles.testLinks}>{device.tests.map(test => <Link key={test.href} href={test.href}>{test.label[lang]}<ArrowUpRight size={16}/></Link>)}</div></section>
  </div>;
}
