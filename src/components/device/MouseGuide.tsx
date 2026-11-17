"use client";

import Link from "@/components/LocaleLink";
import { ArrowRight, Gamepad2, Keyboard, MousePointer2 } from "lucide-react";
import { useDeviceText } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

/** Plain-language background and troubleshooting shown under the mouse checks. */
export function MouseGuide() {
  const { t } = useDeviceText();
  const buttons: [string, string][] = [
    ["1", t("Left (primary) button", "左键（主键）", "Botón izquierdo (principal)")],
    ["2", t("Middle button · pressing the wheel", "中键 · 按下滚轮", "Botón central · pulsar la rueda")],
    ["3", t("Right (secondary) button", "右键（副键）", "Botón derecho (secundario)")],
    ["4", t("Back side button", "后退侧键", "Lateral atrás")],
    ["5", t("Forward side button", "前进侧键", "Lateral adelante")],
  ];
  const problems: [string, string][] = [
    [t("One click registers as a double click", "单击变成双击", "Un clic cuenta como doble"),
     t("Click slowly on the Buttons tab. If “rapid pairs to review” keeps rising while you click once at a time, the switch is likely wearing out. Cleaning rarely helps for long; replacing the switch or the mouse does.", "在“按键”页慢慢地一次点一下。如果“快速连点待复核”还在增加，多半是微动开关老化。清洁通常只能缓解一阵，换微动或换鼠标才能根治。", "Haz clics lentos en la pestaña Botones. Si los pares rápidos siguen subiendo, el interruptor se está desgastando; cambiarlo o cambiar el ratón lo resuelve.")],
    [t("Middle button or wheel click does nothing", "中键 / 滚轮按下没反应", "El botón central no responde"),
     t("Check the mouse software first: many drivers remap the middle button to a shortcut, and then the browser never sees it. Reset the mapping and test again.", "先检查鼠标驱动：很多驱动会把中键改成快捷键，浏览器就收不到了。把映射恢复默认后再测。", "Revisa primero el software del ratón: muchos reasignan el botón central a un atajo. Restablece la asignación y prueba otra vez.")],
    [t("Side buttons do not light up", "侧键不亮", "Los laterales no se iluminan"),
     t("Side buttons are often mapped to copy, paste or macros in the vendor app. Mapped buttons appear under “Extra buttons” as keys; restore them to Back / Forward to test them as mouse buttons.", "侧键常被驱动改成复制、粘贴或宏。被映射的侧键会以键盘按键的形式出现在“其他按键”里；改回“后退 / 前进”才会按鼠标侧键检测。", "Los laterales suelen asignarse a copiar, pegar o macros. Aparecen en «Botones extra» como teclas; devuélvelos a Atrás / Adelante para probarlos.")],
    [t("Scrolling jumps the wrong way", "滚轮往回跳", "La rueda salta al revés"),
     t("Open the Scroll wheel tab, choose one direction and scroll slowly. Repeated opposite-direction events point to a worn or dusty wheel encoder.", "切到“滚轮”页，选定一个方向慢慢滚。反复出现反向事件，通常是滚轮编码器磨损或进灰。", "Abre la pestaña Rueda, elige una dirección y desplaza despacio. Los eventos opuestos repetidos indican un codificador gastado o sucio.")],
  ];
  return <section className={styles.guide} aria-labelledby="mouse-guide-title">
    <p className={styles.guideEyebrow} id="mouse-guide-title">{t("About this mouse test", "关于鼠标检测", "Sobre esta prueba de ratón")}</p>

    <div className={styles.guideQa}>
      <article>
        <h2>{t("Why test a mouse?", "为什么要测鼠标？", "¿Por qué probar el ratón?")}</h2>
        <p>{t("To check a new or second-hand mouse before the return window closes, to confirm that a click which “sometimes double clicks” is really the hardware, or to make sure the side buttons work before a game. The left and right buttons are easy to check anywhere; the middle and side buttons usually are not.", "新鼠标验货、二手鼠标收货、确认“偶尔变双击”到底是不是硬件问题，或者打游戏前确认侧键能用。左右键随便哪里都能试，中键和侧键平时却很难单独确认。", "Para revisar un ratón nuevo o usado antes de que acabe la devolución, confirmar si un doble clic ocasional es del hardware o comprobar los laterales antes de jugar.")}</p>
      </article>
      <article>
        <h2>{t("Which buttons can be tested?", "能测哪些按键？", "¿Qué botones se pueden probar?")}</h2>
        <ul className={styles.guideButtons}>{buttons.map(([n, label]) => <li key={n}><b>{n}</b>{label}</li>)}</ul>
        <p>{t("Plus the wheel in every direction on the Scroll wheel tab. Extra buttons on gaming or MMO mice that the driver turns into keys appear under “Extra buttons”. DPI and profile buttons are handled inside the mouse and never reach the browser, so no website can test them.", "另外，“滚轮”页可以测滚轮的各个方向。游戏鼠标、MMO 鼠标上被驱动映射成键盘按键的额外按键会显示在“其他按键”里。DPI、配置切换键在鼠标内部处理，不会发给浏览器，任何网站都测不了。", "Además, la rueda en todas las direcciones en la pestaña Rueda. Los botones extra que el controlador convierte en teclas aparecen en «Botones extra». Los botones de DPI y perfil no llegan al navegador.")}</p>
      </article>
      <article>
        <h2>{t("Does it work in every browser?", "所有浏览器都能用吗？", "¿Funciona en todos los navegadores?")}</h2>
        <p>{t("Up-to-date Chrome, Edge and Firefox receive all five buttons and the wheel. Safari reports side buttons inconsistently, and phones or tablets have no mouse buttons to test. Nothing is installed and no input leaves your device.", "最新版 Chrome、Edge、Firefox 能收到全部 5 个按键和滚轮。Safari 对侧键的支持不稳定；手机和平板没有鼠标按键可测。无需安装，所有输入都不会离开你的设备。", "Chrome, Edge y Firefox actualizados reciben los cinco botones y la rueda. Safari informa los laterales de forma irregular. No se instala nada y ninguna entrada sale de tu equipo.")}</p>
      </article>
    </div>

    <div className={styles.guideTrouble}>
      <div>
        <h3>{t("Reading the result", "怎么看结果", "Cómo leer el resultado")}</h3>
        <p><ArrowRight size={15} aria-hidden/><span>{t("Every button on your mouse turned green and the wheel moved both ways: ", "鼠标上的每个按键都变绿、滚轮上下都有记录：", "Todos los botones en verde y la rueda en ambos sentidos: ")}<b>{t("your mouse passed.", "通过。", "el ratón pasa.")}</b></span></p>
        <p><ArrowRight size={15} aria-hidden/><span>{t("A button stays grey however you press it, or rapid pairs keep appearing on slow single clicks: ", "某个键怎么按都不变绿，或者慢慢单击仍不断出现快速连点：", "Un botón sigue gris o aparecen pares rápidos con clics lentos: ")}<b>{t("something needs a closer look.", "需要进一步排查。", "hay que revisarlo.")}</b></span></p>
      </div>
      <div>
        <h3>{t("If it did not pass", "没通过怎么办", "Si no pasa")}</h3>
        <ol>
          <li>{t("Rule out software: close or reset the mouse vendor app, then try another up-to-date browser.", "排除软件原因：关闭或重置鼠标驱动的按键映射，再换一个最新版浏览器试试。", "Descarta el software: restablece la app del fabricante y prueba otro navegador actualizado.")}</li>
          <li>{t("Rule out the connection: another USB port, a fresh battery, or the wired mode if it has one.", "排除连接原因：换个 USB 口、换电池，有线模式也试一下。", "Descarta la conexión: otro puerto USB, pila nueva o modo con cable.")}</li>
          <li>{t("Try another computer. If the same button fails there too, the mouse itself is most likely faulty.", "换一台电脑测。如果同一个键还是不行，基本可以确定是鼠标本身的问题。", "Prueba otro ordenador. Si falla el mismo botón, el ratón es casi seguro el problema.")}</li>
        </ol>
      </div>
    </div>

    <div className={styles.guideProblems}>
      <h3>{t("Common mouse problems", "常见鼠标问题", "Problemas habituales")}</h3>
      {problems.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </div>

    <nav className={styles.guideRelated} aria-label={t("Related tests", "相关检测", "Pruebas relacionadas")}>
      <h3>{t("Related tests", "相关检测", "Pruebas relacionadas")}</h3>
      <Link href="/tools/keyboard"><Keyboard size={16} aria-hidden/>{t("Keyboard tester", "键盘检测", "Prueba de teclado")}</Link>
      <Link href="/tools/trackpad"><MousePointer2 size={16} aria-hidden/>{t("Trackpad tester", "触控板检测", "Prueba de panel táctil")}</Link>
      <Link href="/tools/gamepad"><Gamepad2 size={16} aria-hidden/>{t("Gamepad tester", "手柄检测", "Prueba de mando")}</Link>
      <Link href="/games/cps-test">{t("Clicks-per-second test", "CPS 点击速度测试", "Prueba de clics por segundo")}</Link>
    </nav>
  </section>;
}
