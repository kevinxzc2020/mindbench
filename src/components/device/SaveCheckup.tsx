"use client";

import Link from "next/link";
import { useState } from "react";
import { Save } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { mergeHistory, readHistory, validateRecord, writeHistory, type CheckMetric, type ObservationResult, type ReportTool } from "@/lib/device-history";
import { DEVICE_TOOLS, localText, toolText } from "./diagnostic-copy";
import styles from "./ExtendedDiagnostics.module.css";

export function SaveCheckup({ tool, metrics, disabled = false }: { tool: ReportTool; metrics: CheckMetric[]; disabled?: boolean }) {
  const { lang } = useLang();
  const t = (en: string, zh: string, es: string) => localText(lang, en, zh, es);
  const [name, setName] = useState(""), [note, setNote] = useState(""), [result, setResult] = useState<ObservationResult>("unsure"), [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const save = () => {
    try {
      const record = validateRecord({ id: crypto.randomUUID(), tool, at: new Date().toISOString(), name: name.trim() || toolText(lang, DEVICE_TOOLS[tool].title), note: note.trim(), result, metrics });
      writeHistory(mergeHistory(readHistory(), [record])); setFailed(false);
      setMessage(t("Summary saved on this browser. Open history to compare or remove it.", "摘要已保存在此浏览器，可到自检记录中对比或删除。", "Resumen guardado en este navegador. Puedes compararlo o eliminarlo en el historial."));
    } catch { setFailed(true); setMessage(t("Could not save. Storage may be blocked, full, or contain an unreadable record. Nothing was replaced; check history or export the current session.", "无法保存：存储可能被限制、已满或含有无法读取的数据。原记录未被替换，请检查自检记录或导出本轮数据。", "No se pudo guardar: el almacenamiento puede estar bloqueado, lleno o dañado. No se sustituyeron los datos anteriores.")); }
  };
  return <div className={styles.root}><details className={styles.save}><summary><Save size={16}/>{t("Save a checkup summary", "保存自检摘要", "Guardar resumen")}</summary>
    <p className={styles.hint}>{t("Only saved when you click Save. Keeps up to 100 summaries on this browser, including your notes; no recordings, images or raw input events. Older summaries are replaced at the limit. Use the same device label and settings when comparing.", "点击保存才会写入此浏览器，最多保留 100 条摘要和备注；不保存录音、图像或原始输入事件，超出时替换最旧记录。对比时请使用相同设备标签与设置。", "Solo se guarda al pulsar Guardar, hasta 100 resúmenes y notas locales; sin grabaciones, imágenes ni eventos sin procesar. Al llenarse se sustituye el más antiguo. Compara con la misma etiqueta y ajustes.")}</p>
    <div className={styles.fields}>
      <label>{t("Device / session label", "设备／本轮标签", "Etiqueta del dispositivo / sesión")}<input value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder={toolText(lang, DEVICE_TOOLS[tool].title)}/></label>
      <label>{t("Your observation", "你的观察结果", "Tu observación")}<select value={result} onChange={e => setResult(e.target.value as ObservationResult)}><option value="unsure">{t("Not sure / not checked", "不确定／尚未确认", "Sin confirmar")}</option><option value="clear">{t("I noticed no issue", "我未观察到异常", "No observé problemas")}</option><option value="review">{t("Needs another look", "发现需复核现象", "Necesita revisión")}</option></select></label>
      <label>{t("Notes", "备注", "Notas")}<textarea rows={2} value={note} maxLength={500} onChange={e => setNote(e.target.value)}/></label>
    </div><div className={styles.controls}><button disabled={disabled} onClick={save}><Save size={15}/>{t("Save locally", "保存到本机", "Guardar localmente")}</button><Link href="/tools/device-reports">{t("Open checkup history →", "查看自检记录 →", "Abrir historial →")}</Link></div>
    {disabled && <p className={styles.hint}>{t("Collect a sample and stop the test before saving.", "请先采集数据并停止检测，再保存摘要。", "Recoge datos y detén la prueba antes de guardar.")}</p>}
    {message && <p role={failed ? "alert" : "status"} className={failed ? styles.error : styles.hint}>{message}</p>}
  </details></div>;
}
