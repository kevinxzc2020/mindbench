"use client";

import Link from "next/link";
import { ArrowRight, Gamepad2, Mouse } from "lucide-react";
import { useDeviceText } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

/** Plain-language background and troubleshooting shown under the keyboard check. */
export function KeyboardGuide() {
  const { t } = useDeviceText();
  const coverage: [string, string][] = [
    [t("Letters & numbers", "字母与数字", "Letras y números"), t("Main block", "主键区", "Bloque principal")],
    ["F1–F12", t("Function row", "功能键行", "Fila de funciones")],
    [t("Arrows & Ins/Del", "方向键与编辑键", "Flechas y edición"), t("Navigation", "导航区", "Navegación")],
    [t("Numpad", "小键盘", "Teclado numérico"), t("Turn Num Lock on", "需开启 NumLock", "Activa Bloq Num")],
    ["Win / ⌘", t("Lock in fullscreen", "全屏锁定后可测", "Bloqueo en pantalla completa")],
  ];
  const problems: [string, string][] = [
    [t("A key does nothing", "某个键按了没反应", "Una tecla no responde"),
     t("If it stays grey here, the browser never received it. Try another USB port or the wired mode, and make sure the vendor app has not remapped or disabled it. Still grey on another computer: the switch or the circuit under it is faulty.", "在这里一直不变色，说明浏览器根本没收到。换 USB 口或改用有线，确认驱动没有把它改键或禁用。换电脑还是不亮，就是这个键的轴体或下面的电路坏了。", "Si sigue gris, el navegador no la recibió. Prueba otro puerto o el modo con cable y revisa la app del fabricante. Si falla en otro equipo, el interruptor está dañado.")],
    [t("One press types two letters", "按一下出两个字", "Una pulsación escribe dos letras"),
     t("This is key chatter. Tap the key slowly once at a time: if “observations to review” keeps rising, the switch is bouncing. Blowing out dust can help briefly; hot-swap boards can simply replace the switch.", "这是“连击”（键抖）。慢慢地一次按一下：如果“待复核记录”一直增加，就是轴体抖动。吹掉灰尘可能暂时缓解；热插拔键盘直接换轴即可。", "Es rebote de la tecla. Pulsa despacio: si las observaciones suben, el interruptor rebota. Limpiar ayuda un tiempo; en teclados hot-swap basta cambiarlo.")],
    [t("Some keys drop when pressed together", "同时按多个键会丢键", "Se pierden teclas al pulsar varias"),
     t("Hold the keys you use together in games and watch “Most keys held together”. Many office keyboards register only 2–6 keys in certain combinations (ghosting). That is a design limit, not a fault; gaming boards with N-key rollover avoid it.", "把游戏里常一起按的键同时按住，看“最多同时按住”。很多办公键盘在某些组合下只能识别 2–6 个键（键位冲突），这是设计限制，不是故障；标明“全键无冲”的键盘没有这个问题。", "Mantén las teclas que usas juntas y mira «Máximo simultáneo». Muchos teclados de oficina solo registran 2–6 en ciertas combinaciones; es un límite de diseño, no un fallo.")],
    [t("The Win key does not work", "Win 键没反应", "La tecla Win no funciona"),
     t("Most gaming keyboards have a “game mode” or Win-lock switch (often Fn + Win or a lock icon) that disables it. Turn it off and test again.", "大多数游戏键盘有“游戏模式”或 Win 锁（常见是 Fn + Win，或带锁图标的键），开启后 Win 键会失效。关掉再测。", "Muchos teclados gaming tienen modo juego o bloqueo de Win (Fn + Win). Desactívalo y prueba de nuevo.")],
    [t("The numpad lights nothing", "小键盘不亮", "El teclado numérico no se ilumina"),
     t("With Num Lock off, the numpad sends arrow and Home/End keys instead of numbers. Turn Num Lock on, then press each numpad key again.", "NumLock 关闭时，小键盘发出的是方向键、Home/End，而不是数字。打开 NumLock 后再逐个按一遍。", "Con Bloq Num desactivado, el teclado numérico envía flechas e Inicio/Fin. Actívalo y vuelve a probar.")],
  ];
  return <section className={styles.guide} aria-labelledby="keyboard-guide-title">
    <p className={styles.guideEyebrow} id="keyboard-guide-title">{t("About this keyboard test", "关于键盘检测", "Sobre esta prueba de teclado")}</p>

    <div className={styles.guideQa}>
      <article>
        <h2>{t("Why test a keyboard?", "为什么要测键盘？", "¿Por qué probar el teclado?")}</h2>
        <p>{t("To check a new or second-hand keyboard before the return window closes, to find out whether a key that “sometimes types twice” is really the hardware, to see which keys survived a spilled drink, or to confirm that the keys you press together in games all register.", "新键盘验货、二手键盘收货、确认“偶尔一下出两个字”到底是不是硬件问题、键盘进水后看看哪些键还好，或者确认游戏里同时按的几个键都能被识别。", "Para revisar un teclado nuevo o usado, comprobar si una tecla que a veces escribe dos veces es del hardware, ver qué teclas sobrevivieron a un derrame o confirmar las combinaciones que usas al jugar.")}</p>
      </article>
      <article>
        <h2>{t("What can be tested?", "能测哪些键？", "¿Qué se puede probar?")}</h2>
        <ul className={styles.guideButtons}>{coverage.map(([name, note]) => <li key={name}><b>✓</b>{name}<small className={styles.guideNote}>{note}</small></li>)}</ul>
        <p>{t("Every key that reaches the browser lights up on the map, plus auto-repeat, chatter and how many keys can be held at once. The Fn key, brightness or RGB keys and other functions handled inside the keyboard never reach the computer, so no website can test them. Keys missing from the map show up under the keyboard as extra keys.", "所有发到浏览器的键都会在键位图上亮起，同时记录长按自动重复、连击，以及最多能同时按住几个键。Fn 键、亮度和灯效键等在键盘内部处理的功能不会发给电脑，任何网站都测不了。键位图上没有的键会在键盘下方单独列出。", "Cada tecla que llega al navegador se ilumina, además de la repetición, el rebote y cuántas teclas se pueden mantener. Fn, brillo o RGB se gestionan dentro del teclado y ningún sitio puede probarlas.")}</p>
      </article>
      <article>
        <h2>{t("Does it work in every browser?", "所有浏览器都能用吗？", "¿Funciona en todos los navegadores?")}</h2>
        <p>{t("Every modern browser receives normal keys. Chrome and Edge also read your language layout and can lock Win/⌘ in fullscreen so it does not open the Start menu. On a Mac, macOS hides some key releases while ⌘ is held; the test accounts for that. Nothing is installed and no keystroke leaves your device.", "所有现代浏览器都能收到普通按键。Chrome 和 Edge 还能读取你的语言布局，并能在全屏时锁定 Win/⌘，按下不会弹出开始菜单。在 Mac 上按住 ⌘ 时系统会吞掉部分松开事件，检测已做处理。无需安装，任何按键都不会离开你的设备。", "Todos los navegadores modernos reciben las teclas normales. Chrome y Edge además leen la distribución y bloquean Win/⌘ en pantalla completa. No se instala nada y ninguna pulsación sale de tu equipo.")}</p>
      </article>
    </div>

    <div className={styles.guideTrouble}>
      <div>
        <h3>{t("Reading the result", "怎么看结果", "Cómo leer el resultado")}</h3>
        <p><ArrowRight size={15} aria-hidden/><span>{t("Coverage reaches the full count and every key lit up once per press: ", "“当前布局已收到”达到总数，每按一次只记一次：", "La cobertura llega al total y cada pulsación cuenta una vez: ")}<b>{t("your keyboard passed.", "通过。", "el teclado pasa.")}</b></span></p>
        <p><ArrowRight size={15} aria-hidden/><span>{t("A key stays grey, counts two presses for one, or keys drop when held together: ", "某个键一直灰着、按一下记两次，或者同时按时丢键：", "Una tecla sigue gris, cuenta doble o se pierden teclas juntas: ")}<b>{t("something needs a closer look.", "需要进一步排查。", "hay que revisarlo.")}</b></span></p>
      </div>
      <div>
        <h3>{t("If it did not pass", "没通过怎么办", "Si no pasa")}</h3>
        <ol>
          <li>{t("Rule out settings: check that the layout above matches your keyboard, Num Lock is on and no game mode or vendor remapping is active.", "排除设置原因：确认上方布局和你的键盘一致、NumLock 已开启、没有开游戏模式或驱动改键。", "Descarta ajustes: distribución correcta, Bloq Num activado y sin modo juego ni reasignaciones.")}</li>
          <li>{t("Rule out the connection: another USB port, the cable instead of wireless, or a fresh battery.", "排除连接原因：换 USB 口、无线改有线，或者换电池。", "Descarta la conexión: otro puerto USB, cable en vez de inalámbrico o pila nueva.")}</li>
          <li>{t("Try another computer. If the same keys fail there too, the keyboard itself is most likely faulty.", "换一台电脑测。如果还是同样几个键有问题，基本可以确定是键盘本身的问题。", "Prueba otro ordenador. Si fallan las mismas teclas, el teclado es casi seguro el problema.")}</li>
        </ol>
      </div>
    </div>

    <div className={styles.guideProblems}>
      <h3>{t("Common keyboard problems", "常见键盘问题", "Problemas habituales")}</h3>
      {problems.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </div>

    <nav className={styles.guideRelated} aria-label={t("Related tests", "相关检测", "Pruebas relacionadas")}>
      <h3>{t("Related tests", "相关检测", "Pruebas relacionadas")}</h3>
      <Link href="/tools/mouse"><Mouse size={16} aria-hidden/>{t("Mouse tester", "鼠标检测", "Prueba de ratón")}</Link>
      <Link href="/tools/gamepad"><Gamepad2 size={16} aria-hidden/>{t("Gamepad tester", "手柄检测", "Prueba de mando")}</Link>
      <Link href="/games/typing-test">{t("Typing speed test", "打字速度测试", "Prueba de mecanografía")}</Link>
    </nav>
  </section>;
}
