"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, Download, File, FileImage, FileText, Files, Music2, ShieldCheck, Table2, Upload, X } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { CONVERTERS, CONVERSION_LIMITS, ConversionError, getConverter, uniqueOutputName, validateConversionFile, type ConverterId, type ConversionErrorCode } from "@/lib/converters";
import { convertFile, imagesToPdf, DEFAULT_CONVERSION_OPTIONS, type ConversionOptions, type ConvertedFile } from "@/lib/conversion-engine";
import { trackConversion } from "@/lib/analytics";
import { CONVERTER_COPY, conversionErrorMessage } from "./converter-copy";
import styles from "./Converters.module.css";

const ICONS = { image: FileImage, pdf: Files, audio: Music2, data: Table2 };
const sizeLabel = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
type Row = { key: string; file: File; status: "queued" | "processing" | "done" | "failed"; error?: ConversionErrorCode };
type Result = ConvertedFile & { url: string };

export function ConverterHub() {
  const { lang } = useLang(), c = CONVERTER_COPY[lang];
  const [category, setCategory] = useState("all");
  const categories = ["all", "image", "pdf", "audio", "data"] as const;
  return <div className={styles.page}>
    <nav className={styles.breadcrumb} aria-label={c.hub}><Link href="/">{c.home}</Link><span>/</span><Link href="/collections/utilities">{c.utilities}</Link><span>/</span><span>{c.hub}</span></nav>
    <header className={styles.hero}><div><p className={styles.eyebrow}>MINDBENCH / {c.hub}</p><h1>{c.title}</h1><p>{c.intro}</p></div><div className={styles.formatArt} aria-hidden="true"><span>PNG</span><ArrowRight/><span>WEBP</span><span>CSV</span><ArrowRight/><span>JSON</span></div></header>
    <div className={styles.local}><ShieldCheck size={19}/><div><strong>{c.local}</strong><p>{c.localNote}</p></div></div>
    <nav className={styles.tabs} aria-label={c.all}>{categories.map(id => <button type="button" key={id} aria-pressed={id === category} onClick={() => setCategory(id)}>{c[id]}</button>)}</nav>
    <section className={styles.toolGrid} aria-label={c.all}>{CONVERTERS.filter(t => category === "all" || t.category === category).map(tool => { const Icon = ICONS[tool.category]; return <Link className={styles.tool} key={tool.id} href={`/convert/${tool.id}`}><div className={styles.toolTop}><span className={styles.icon}><Icon size={24}/></span><span>{tool.formats}</span></div><h2>{tool.title[lang]}</h2><p>{tool.description[lang]}</p><span className={styles.open}>{c.open}<ArrowUpRight size={18}/></span></Link>; })}</section>
    <p className={styles.scope}>{c.scope}</p>
  </div>;
}

export function ConverterWorkbench({ id }: { id: ConverterId }) {
  const { lang } = useLang(), c = CONVERTER_COPY[lang], tool = getConverter(id)!;
  const [rows, setRows] = useState<Row[]>([]), [results, setResults] = useState<Result[]>([]);
  const [options, setOptions] = useState<ConversionOptions>({ ...DEFAULT_CONVERSION_OPTIONS });
  const [busy, setBusy] = useState(false), [zipBusy, setZipBusy] = useState(false), [dragging, setDragging] = useState(false);
  const [issues, setIssues] = useState<{ name: string; code: ConversionErrorCode }[]>([]), [message, setMessage] = useState<"cancelled" | "emptyResults" | "zipError" | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const input = useRef<HTMLInputElement>(null), controller = useRef<AbortController | null>(null), urls = useRef<string[]>([]), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current = []; }; }, []);
  const releaseResults = () => { urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current = []; setResults([]); };
  function addFiles(files: File[]) {
    if (busy || zipBusy) return;
    const accepted = [...rows], rejected: typeof issues = [];
    for (const file of files) {
      try {
        validateConversionFile(file, id);
        if (accepted.length >= CONVERSION_LIMITS.files) throw new ConversionError("count");
        if (accepted.reduce((n, item) => n + item.file.size, file.size) > CONVERSION_LIMITS.totalBytes) throw new ConversionError("total");
        accepted.push({ key: crypto.randomUUID(), file, status: "queued" });
      } catch (error) { rejected.push({ name: file.name, code: error instanceof ConversionError ? error.code : "decode" }); }
    }
    setRows(accepted); setIssues(rejected); setMessage(null);
  }
  function move(index: number, direction: number) { setRows(current => { const next = [...current], destination = index + direction; if (destination < 0 || destination >= next.length) return current; [next[index], next[destination]] = [next[destination], next[index]]; return next; }); }
  function setOption<K extends keyof ConversionOptions>(key: K, value: ConversionOptions[K]) { setOptions(old => ({ ...old, [key]: value })); }
  async function run() {
    if (!rows.length || busy) return;
    releaseResults(); setIssues([]); setMessage(null); setBusy(true);
    const job = new AbortController(); controller.current = job;
    const used = new Set<string>(); let outputBytes = 0, outputCount = 0;
    const append = (files: ConvertedFile[]) => {
      if (job.signal.aborted || !mounted.current) throw new ConversionError("cancelled");
      const newBytes = files.reduce((n, f) => n + f.blob.size, 0);
      if (outputBytes + newBytes > CONVERSION_LIMITS.outputBytes) throw new ConversionError("output");
      outputBytes += newBytes; outputCount += files.length;
      const next = files.map(file => { const url = URL.createObjectURL(file.blob); urls.current.push(url); return { ...file, name: uniqueOutputName(file.name, used), url }; });
      setResults(current => [...current, ...next]);
    };
    const update = (key: string, status: Row["status"], error?: ConversionErrorCode) => { if (mounted.current) setRows(current => current.map(row => row.key === key ? { ...row, status, error } : row)); };
    trackConversion("conversion_start", id);
    setRows(current => current.map(row => ({ ...row, status: "queued", error: undefined })));
    setProgress({ done: 0, total: rows.length });
    try {
      if (id === "images-to-pdf") {
        setRows(current => current.map(row => ({ ...row, status: "processing" })));
        append(await imagesToPdf(rows.map(row => row.file), options, job.signal, (done, total) => { if (mounted.current) setProgress({ done, total }); }));
        rows.forEach(row => update(row.key, "done"));
      } else {
        for (const [index, row] of Array.from(rows.entries())) {
          if (job.signal.aborted) throw new ConversionError("cancelled");
          update(row.key, "processing");
          try {
            append(await convertFile(row.file, id, options, job.signal, (done, total) => { if (mounted.current) setProgress({ done: index + done / total, total: rows.length }); }));
            update(row.key, "done");
          } catch (error) {
            if (job.signal.aborted) throw new ConversionError("cancelled");
            update(row.key, "failed", error instanceof ConversionError ? error.code : "decode");
          }
          if (mounted.current) setProgress({ done: index + 1, total: rows.length });
          await new Promise<void>(resolve => setTimeout(resolve, 0));
        }
      }
      if (mounted.current && !outputCount) setMessage("emptyResults");
      if (outputCount) trackConversion("conversion_complete", id);
    } catch (error) {
      if (mounted.current) {
        const code = error instanceof ConversionError ? error.code : "decode";
        if (code === "cancelled") { setMessage("cancelled"); setRows(current => current.map(row => row.status === "processing" ? { ...row, status: "queued" } : row)); }
        else { setIssues([{ name: "", code }]); rows.forEach(row => update(row.key, "failed", code)); }
      }
    } finally { if (mounted.current) { setBusy(false); controller.current = null; } }
  }
  async function downloadZip() {
    if (busy || zipBusy || !results.length) return;
    setZipBusy(true); setMessage(null);
    try {
      const { zip } = await import("fflate");
      const files = Object.fromEntries(await Promise.all(results.map(async result => [result.name, new Uint8Array(await result.blob.arrayBuffer())])));
      const data = await new Promise<Uint8Array>((resolve, reject) => zip(files, { level: 0 }, (err, bytes) => err ? reject(err) : resolve(bytes)));
      if (!mounted.current) return;
      const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: "application/zip" })); urls.current.push(url);
      const link = document.createElement("a"); link.href = url; link.download = `mindbench-${id}.zip`; document.body.appendChild(link); link.click(); link.remove();
      trackConversion("conversion_download", id);
    } catch { if (mounted.current) setMessage("zipError"); } finally { if (mounted.current) setZipBusy(false); }
  }
  const disabled = busy || zipBusy;
  const imageSettings = id === "image" || id === "images-to-pdf";
  const note = id === "image" ? c.imageNote : id === "images-to-pdf" ? c.pdfNote : id === "pdf-to-images" ? c.renderNote : id === "audio-to-wav" ? c.audioNote : c.dataNote;
  return <div className={styles.page}>
    <nav className={styles.breadcrumb} aria-label={c.hub}><Link href="/convert"><ArrowLeft size={14}/>{c.back}</Link><span>/</span><span>{tool.title[lang]}</span></nav>
    <header className={styles.workHeader}><p className={styles.eyebrow}>{tool.formats}</p><h1>{tool.title[lang]}</h1><p>{tool.description[lang]}</p><span className={styles.localBadge}><ShieldCheck size={15}/>{c.local}</span></header>
    <ol className={styles.steps}>{c.steps.map((step, i) => <li key={i}><span>{i + 1}</span>{step}</li>)}</ol>
    <div className={styles.workGrid}>
      <section className={styles.files} aria-label={c.queue}>
        <div className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`} onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) addFiles(Array.from(event.dataTransfer.files)); }}>
          <Upload size={28} aria-hidden="true"/><h2>{c.drop}</h2><p>{c.or}</p><button type="button" className={styles.primary} disabled={disabled} onClick={() => input.current?.click()}>{c.select}</button>
          <input ref={input} type="file" hidden multiple accept={tool.accept} aria-label={c.select} onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }}/>
          <span className={styles.accept}>{tool.accept.replaceAll(".", "").toUpperCase().replaceAll(",", " · ")}</span>
          <small>{c.limits}</small>
        </div>
        {issues.length > 0 && <ul className={styles.errors} role="alert">{issues.map((issue, i) => <li key={i}>{issue.name && <strong>{issue.name}: </strong>}{conversionErrorMessage(issue.code, lang)}</li>)}</ul>}
        {tool.category === "data" && <button className={styles.sample} type="button" disabled={disabled} onClick={() => addFiles([new window.File([id === "csv-to-json" ? 'name,note\r\nMindBench,"Hello, 世界"\r\n' : '[{"name":"MindBench","note":"Hello, 世界"}]'], id === "csv-to-json" ? "example.csv" : "example.json", { type: "text/plain" })])}>{c.sample}<ArrowRight size={14}/></button>}
        {rows.length > 0 && <div className={styles.queue}><h2>{c.queue} <span>{rows.length}</span></h2><ol>{rows.map((row, index) => <li key={row.key}><File size={19}/><div><strong>{row.file.name}</strong><small>{sizeLabel(row.file.size)} · {c[row.status]}</small>{row.error && <p className={styles.errorText}>{conversionErrorMessage(row.error, lang)}</p>}</div><div className={styles.rowActions}>{id === "images-to-pdf" && <><button disabled={disabled || index === 0} type="button" aria-label={`${c.up}: ${row.file.name}`} onClick={() => move(index, -1)}><ArrowUp size={16}/></button><button disabled={disabled || index === rows.length - 1} type="button" aria-label={`${c.down}: ${row.file.name}`} onClick={() => move(index, 1)}><ArrowDown size={16}/></button></>}<button disabled={disabled} type="button" aria-label={`${c.remove}: ${row.file.name}`} onClick={() => setRows(current => current.filter(item => item.key !== row.key))}><X size={17}/></button></div></li>)}</ol></div>}
        <p className={styles.note}>{note}</p>
      </section>
      <section className={styles.settings} aria-label={c.output}><h2>{c.output}</h2><fieldset disabled={disabled}>
        {(id === "image" || id === "pdf-to-images") && <label>{c.format}<select value={options.format} onChange={e => setOption("format", e.target.value as ConversionOptions["format"])}><option value="png">PNG</option><option value="jpeg">JPG</option>{id === "image" && <option value="webp">WebP</option>}</select></label>}
        {(imageSettings || id === "pdf-to-images") && <label>{c.quality} <span>{Math.round(options.quality * 100)}%</span><input aria-label={c.quality} type="range" min="30" max="100" step="5" disabled={id !== "images-to-pdf" && options.format === "png"} value={options.quality * 100} onChange={e => setOption("quality", Number(e.target.value) / 100)}/></label>}
        {imageSettings && <label>{c.resize}<select value={options.maxEdge} onChange={e => setOption("maxEdge", Number(e.target.value))}><option value="0">{c.original}</option>{[1024, 2048, 4096].map(n => <option key={n} value={n}>{n} px</option>)}</select></label>}
        {id === "images-to-pdf" && <label>{c.paper}<select value={options.pdfPaper} onChange={e => setOption("pdfPaper", e.target.value as "a4" | "fit")}><option value="a4">A4</option><option value="fit">{c.fit}</option></select></label>}
        {id === "pdf-to-images" && <><label>{c.pages}<input type="text" value={options.pages} placeholder="1-3, 5" onChange={e => setOption("pages", e.target.value)} aria-describedby="page-help"/></label><p id="page-help" className={styles.help}>{c.pageHint}</p><label>{c.scale}<select value={options.pdfScale} onChange={e => setOption("pdfScale", Number(e.target.value))}>{[1, 1.5, 2].map(n => <option key={n} value={n}>{n}×</option>)}</select></label></>}
        {id === "audio-to-wav" && <><label>{c.rate}<select value={options.sampleRate} onChange={e => setOption("sampleRate", Number(e.target.value))}><option value="44100">44,100 Hz</option><option value="48000">48,000 Hz</option></select></label><label className={styles.checkbox}><input type="checkbox" checked={options.mono} onChange={e => setOption("mono", e.target.checked)}/>{c.mono}</label></>}
        {tool.category === "data" && <label>{c.delimiter}<select value={options.delimiter} onChange={e => setOption("delimiter", e.target.value)}><option value=",">{c.comma}</option><option value=";">{c.semicolon}</option><option value={"\t"}>{c.tab}</option></select></label>}
        {id === "json-to-csv" && <><label className={styles.checkbox}><input type="checkbox" checked={options.protectFormulas} onChange={e => setOption("protectFormulas", e.target.checked)}/>{c.protect}</label><p className={styles.help}>{c.formulaNote}</p></>}
      </fieldset><button type="button" className={styles.primary} disabled={disabled || !rows.length} onClick={run}>{busy ? c.running : c.convert}<ArrowRight size={17}/></button>{busy && <button type="button" className={styles.secondary} onClick={() => controller.current?.abort()}>{c.stop}</button>}
      {!rows.length && <p className={styles.help}>{c.noFiles}</p>}
      {(busy || progress.total > 0) && <div className={styles.progress} role="status"><progress value={progress.done} max={progress.total || 1}/><span>{Math.floor(progress.done)} / {progress.total} {c.completed}</span></div>}
      {(rows.length > 0 || results.length > 0) && <button type="button" className={styles.clear} disabled={disabled} onClick={() => { releaseResults(); setRows([]); setIssues([]); setMessage(null); setProgress({ done: 0, total: 0 }); }}>{c.clear}</button>}
      </section>
    </div>
    {message && <p className={styles.note} role="status">{c[message]}</p>}
    {results.length > 0 && <section className={styles.results} aria-label={c.results}><header><div><p className={styles.eyebrow}><Check size={16}/>{c.ready}</p><h2>{c.results} <span>{results.length}</span></h2></div><button type="button" className={styles.secondary} disabled={disabled} onClick={downloadZip}><Download size={17}/>{zipBusy ? c.zipping : c.zip}</button></header><div className={styles.resultGrid}>{results.map(result => <article className={styles.result} key={result.url}>
      {result.kind === "image" ? <img src={result.url} alt={result.name} className={styles.preview}/> : result.kind === "audio" ? <audio src={result.url} controls preload="metadata"/> : <div className={styles.documentIcon}><FileText size={30}/></div>}
      <div><h3>{result.name}</h3><p>{sizeLabel(result.blob.size)}</p>{Boolean(result.protectedCells) && <p>{c.protected}: {result.protectedCells}</p>}<a href={result.url} download={result.name} onClick={() => trackConversion("conversion_download", id)}><Download size={16}/>{c.download}</a></div></article>)}</div></section>}
    <div className={styles.local}><ShieldCheck size={19}/><div><strong>{c.local}</strong><p>{c.localNote}</p></div></div>
    <nav className={styles.related} aria-label={c.more}><h2>{c.more}</h2>{CONVERTERS.filter(t => t.id !== id).map(t => <Link href={`/convert/${t.id}`} key={t.id}>{t.title[lang]}<ArrowUpRight size={15}/></Link>)}</nav>
  </div>;
}
