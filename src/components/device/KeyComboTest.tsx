"use client";

import { useEffect, useState } from "react";
import { freshCombo, KEY_COMBOS, updateCombo, type ComboResult } from "@/lib/keyboard-layout";
import { useDeviceText } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

const label = (code: string) => code.replace(/^Key/, "").replace(/^Digit/, "").replace(/Left$/, " L").replace(/Right$/, " R").replace("Semicolon", ";").replace("Control", "Ctrl");

/** Guided rollover check: hold every key of a combination together and see which ones arrive. */
export function KeyComboTest({ held, active, resetKey }: { held: string[]; active: boolean; resetKey: number }) {
  const { t } = useDeviceText();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ComboResult[]>(() => KEY_COMBOS.map(c => freshCombo(c.keys)));
  const combo = KEY_COMBOS[index];
  const heldKey = held.join("|");
  useEffect(() => { setIndex(0); setResults(KEY_COMBOS.map(c => freshCombo(c.keys))); }, [resetKey]);
  useEffect(() => {
    if (!active) return;
    setResults(list => { const next = updateCombo(list[index], combo.keys, heldKey ? heldKey.split("|") : []); return next === list[index] ? list : list.map((r, i) => i === index ? next : r); });
  }, [active, heldKey, index, combo.keys]);
  const current = results[index];
  useEffect(() => {
    if (!current.passed || index >= KEY_COMBOS.length - 1) return;
    const timer = window.setTimeout(() => setIndex(i => Math.min(i + 1, KEY_COMBOS.length - 1)), 700);
    return () => clearTimeout(timer);
  }, [current.passed, index]);
  const tried = results.filter(r => r.best > 0);
  return <section className={styles.comboPanel} aria-live="polite">
    <div className={styles.sectionHead}><h2>{t("Key combination check", "组合键检查", "Combinaciones de teclas")}</h2><span>{index + 1} / {KEY_COMBOS.length}</span></div>
    <p className={styles.caption}>{t("While the test is running, hold all of these keys down together. Keys that light up were received at the same time.", "检测进行时，同时按住下面所有按键。亮起的键表示浏览器同时收到了它们。", "Con la prueba activa, mantén pulsadas todas estas teclas a la vez. Las que se iluminan se recibieron juntas.")}</p>
    <div className={styles.comboKeys}>{combo.keys.map(code => <span key={code} className={held.includes(code) ? styles.comboHeld : current.passed || (current.best > 0 && !current.missing.includes(code)) ? styles.comboSeen : undefined}>{label(code)}</span>)}</div>
    <p className={current.passed ? styles.comboPass : styles.caption}>{current.passed ? t("All keys received together.", "全部按键同时收到。", "Todas las teclas recibidas juntas.") : `${t("Most held together", "最多同时收到", "Máximo simultáneo")}: ${current.best} / ${combo.keys.length}`}</p>
    <div className={styles.comboActions}>
      <button type="button" disabled={index === 0} onMouseDown={e => e.preventDefault()} onClick={() => setIndex(i => i - 1)}>{t("Previous", "上一组", "Anterior")}</button>
      <button type="button" disabled={index === KEY_COMBOS.length - 1} onMouseDown={e => e.preventDefault()} onClick={() => setIndex(i => i + 1)}>{current.passed ? t("Next", "下一组", "Siguiente") : t("Skip", "跳过", "Omitir")}</button>
    </div>
    {tried.length > 0 && <ul className={styles.comboResults}>{KEY_COMBOS.map((c, i) => results[i].best > 0 && <li key={c.id}><b>{c.keys.map(label).join(" + ")}</b>: {results[i].passed ? t("received together", "同时收到", "recibidas juntas") : `${results[i].best} / ${c.keys.length} · ${t("not received with the others", "未与其他键同时收到", "no recibidas con las demás")}: ${results[i].missing.map(label).join(", ")}`}</li>)}</ul>}
    <p className={styles.caption}>{t("A missing key here can come from the keyboard's rollover limit (ghosting), the OS, or simply not pressing it. Re-check before drawing conclusions.", "这里缺失的键可能来自键盘的无冲数量限制（漏键），也可能是系统拦截或没按到。请复测后再下结论。", "Una tecla ausente puede deberse al límite de rollover, al sistema o a no haberla pulsado. Repite antes de concluir.")}</p>
  </section>;
}
