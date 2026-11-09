"use client";

import { useEffect, useState } from "react";
import { useDeviceText } from "./DiagnosticShared";
import styles from "./ScreenTester.module.css";

export function ScreenColorInput({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const { t } = useDeviceText();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const valid = /^#[0-9a-f]{6}$/i.test(draft);
  return <div className={styles.colorInput}>
    <input type="color" aria-label={t("Color picker", "颜色选择器", "Selector de color")} value={value} onInput={e => onChange(e.currentTarget.value)} onChange={e => onChange(e.target.value)}/>
    <input type="text" aria-label={t("Custom color · HEX", "自定义颜色 · HEX", "Color personalizado · HEX")} value={draft} maxLength={7} spellCheck={false} autoComplete="off" aria-invalid={!valid} placeholder="#ffffff" onChange={e => { const next = e.target.value; setDraft(next); if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase()); }} onBlur={() => { if (!valid) setDraft(value); }}/>
  </div>;
}
