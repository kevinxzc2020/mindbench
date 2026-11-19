"use client";

import Link from "@/components/LocaleLink";
import { Smartphone } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { DEVICE_TOOLS, TOUCH_FRIENDLY_CHECKS, toolText } from "./diagnostic-copy";
import { useDeviceText } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

/**
 * Keyboard, mouse, wheel and trackpad checks read hardware a phone does not have. Say so before the visitor taps Start and waits
 * for input that can never arrive, and point to the checks a touch screen can run on its own.
 *
 * Whether to show it is decided in CSS (see `.touchNotice`): only when no mouse or trackpad is attached. That keeps it out of
 * the way on desktops and avoids a late layout shift or hydration mismatch on phones.
 */
export function TouchOnlyNotice({ tool }: { tool: "keyboard" | "mouse" | "wheel" | "trackpad" }) {
  const { lang } = useLang();
  const { t } = useDeviceText();
  const body = tool === "keyboard"
    ? t(
      "This check reads a physical keyboard, so a touch screen has nothing to test. Connect a keyboard and press any key, or try a check that works on this device:",
      "这项检测读取的是实体键盘，触屏上没有可测的按键。接上键盘后按任意键即可；也可以先试试这台设备上能做的检测：",
      "Esta prueba lee un teclado físico, así que una pantalla táctil no tiene nada que comprobar. Conecta un teclado y pulsa cualquier tecla, o prueba una comprobación que funciona en este dispositivo:",
    )
    : t(
      "This check needs a mouse or trackpad, and touch input is not counted. Connect one, or try a check that works on this device:",
      "这项检测需要鼠标或触控板，触屏输入不计入。接上之后即可开始；也可以先试试这台设备上能做的检测：",
      "Esta prueba necesita un ratón o un panel táctil, y la entrada táctil no cuenta. Conecta uno o prueba una comprobación que funciona en este dispositivo:",
    );
  return <div className={styles.touchNotice} role="note">
    <strong><Smartphone size={15} aria-hidden="true"/>{t("Using a phone or tablet?", "在用手机或平板？", "¿Usas un móvil o una tableta?")}</strong>
    <p>{body}</p>
    <ul>{TOUCH_FRIENDLY_CHECKS.map(id => <li key={id}><Link href={`/tools/${id}`}>{toolText(lang, DEVICE_TOOLS[id].title)}</Link></li>)}</ul>
  </div>;
}
