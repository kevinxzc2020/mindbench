"use client";

import { useEffect, useState } from "react";
import { createWheelState, interruptWheel, wheelInput, type WheelDirection } from "@/lib/device-diagnostics";
import { Help, SessionControls, SessionReport, Stat, useDeviceText, useDiagnosticSession } from "./DiagnosticShared";
import styles from "./DeviceDiagnostics.module.css";

export function WheelTester() {
  const { c,t } = useDeviceText();
  const session = useDiagnosticSession(createWheelState, interruptWheel);
  const [expected,setExpected] = useState<WheelDirection>("free");
  const [axis,setAxis] = useState<"x"|"y">("y");
  const s=session.state.current;
  const directions: Record<WheelDirection,string>={free:t("Free observation","自由观察","Observación libre"),up:t("Up only · ΔY < 0","只向上 · ΔY < 0","Solo arriba · ΔY < 0"),down:t("Down only · ΔY > 0","只向下 · ΔY > 0","Solo abajo · ΔY > 0"),left:t("Left only · ΔX < 0","只向左 · ΔX < 0","Solo izquierda · ΔX < 0"),right:t("Right only · ΔX > 0","只向右 · ΔX > 0","Solo derecha · ΔX > 0")};
  const unit=(n:number)=>n===0?t("pixels","像素","píxeles"):n===1?t("lines","行","líneas"):n===2?t("pages","页","páginas"):t("unknown units","未知单位","unidades desconocidas");
  useEffect(()=>{
    const el=session.surface.current;if(!el)return;
    const onWheel=(e:WheelEvent)=>{
      if(!session.listening.current||!e.isTrusted)return;
      if(e.cancelable)e.preventDefault();
      // Read deltaMode before deltas. Never pretend line/page values are pixel distances.
      const mode=e.deltaMode;wheelInput(session.state.current,e.deltaX,e.deltaY,mode,e.ctrlKey,expected,session.clock());session.refresh();
    };
    el.addEventListener("wheel",onWheel,{passive:false});return()=>el.removeEventListener("wheel",onWheel);
  },[expected,session.surface,session.listening,session.state,session.clock,session.refresh]);
  const latest=s.samples[s.samples.length-1];
  // A chart uses one deltaMode at a time so incompatible units aren't compared.
  const mode=latest?.mode??0;
  const samples=s.samples.filter(sample=>sample.mode===mode);
  const max=Math.max(1,...samples.map(sample=>Math.abs(sample[axis])));
  return <>
    <ol className={styles.steps}><li>{t("Choose free observation or one expected direction, then start the test.","选择自由观察或一个预期方向，然后开始检测。","Elige observación libre o una dirección e inicia la prueba.")}</li><li>{t("Move the pointer into the test area. In a one-way test, scroll slowly in that direction without reversing.","将光标放进检测区域。单向测试时，请缓慢朝同一方向滚动，不要主动反转。","Pon el cursor en el área. En una prueba unidireccional, desplázate despacio sin invertir el sentido.")}</li><li>{t("Pause and review opposite-direction events; repeat in the other direction separately.","暂停后复核反向事件，再新开一轮检测另一方向。","Pausa y revisa las entradas opuestas; prueba el otro sentido en otra sesión.")}</li></ol>
    <div className={styles.settings}><label>{t("Expected direction","预期滚动方向","Dirección esperada")}<select value={expected} disabled={session.active} onChange={e=>{const v=e.target.value as WheelDirection;setExpected(v);setAxis(v==="left"||v==="right"?"x":"y");session.reset();}}>{Object.entries(directions).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><p>{c("settingHint")} {t("Direction means scroll input, not the physical rotation of your wheel.","方向指滚动输入方向，不是滚轮实体转动方向。","La dirección se refiere a la entrada de desplazamiento, no al giro físico de la rueda.")}</p></div>
    <SessionControls session={session}/>
    <div className={styles.stats}><Stat label={t("Scroll events","滚动事件","Eventos")} value={s.events}/><Stat label={t("Up / down","向上 / 向下","Arriba / abajo")} value={`${s.up} / ${s.down}`}/><Stat label={t("Left / right","向左 / 向右","Izquierda / derecha")} value={`${s.left} / ${s.right}`}/><Stat label={expected==="free"?t("Direction changes","方向变化","Cambios de dirección"):t("Opposite events","反向事件","Eventos opuestos")} value={expected==="free"?s.reversals:s.opposite} warning={expected!=="free"&&s.opposite>0}/></div>
    <div ref={session.surface} tabIndex={0} role="region" aria-label={t("Scroll wheel test area","滚轮检测区域","Área de prueba de rueda")} aria-describedby="wheel-focus-help" className={`${styles.surface} ${styles.wheelSurface} ${session.active?styles.listening:""}`}
      onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))session.pause("focus-lost");}} onKeyDown={e=>{if(e.code==="Escape"&&session.active){e.preventDefault();session.pause("escape",true);}}}>
      <div className={styles.surfaceHead}><strong>{directions[expected]}</strong><span>{t("Scrolling is contained here while active","检测时仅在此区域接收滚动","El desplazamiento se captura aquí durante la prueba")}</span></div>
      <div className={styles.wheelCompass} aria-hidden="true"><span className={latest&&latest.y<0?styles.directionLit:undefined}>↑</span><span className={latest&&latest.x<0?styles.directionLit:undefined}>←</span><div className={styles.wheelCore}>{s.events}<small>{t("EVENTS","次输入","EVENTOS")}</small></div><span className={latest&&latest.x>0?styles.directionLit:undefined}>→</span><span className={latest&&latest.y>0?styles.directionLit:undefined}>↓</span></div>
      <div className={styles.surfaceFoot}>{latest ? `ΔX ${latest.x.toFixed(2)} · ΔY ${latest.y.toFixed(2)} · ${unit(mode)}` : t("Move your pointer here and scroll","将光标移到这里，再滚动滚轮","Pon el cursor aquí y desplaza la rueda")}</div>
    </div>
    <p id="wheel-focus-help" className={styles.caption}>{c("focus")}</p>
    <section className={styles.graphPanel}><div className={styles.sectionHead}><h2>{t("Recent scroll input","最近滚动输入","Entradas recientes")}</h2><div className={styles.segmented}><button aria-pressed={axis==="y"} onClick={()=>setAxis("y")}>{t("Vertical","纵向","Vertical")} Y</button><button aria-pressed={axis==="x"} onClick={()=>setAxis("x")}>{t("Horizontal","横向","Horizontal")} X</button></div></div>
      <p className={styles.caption}>{t("Raw deltas · latest 80 events · one unit at a time · orange indicates opposite input","原始增量 · 最近 80 次事件 · 按同一单位显示 · 橙色为反向输入","Deltas originales · últimos 80 eventos · una unidad a la vez · naranja indica entrada opuesta")} · {unit(mode)}</p>
      <div className={styles.wheelChart} role="img" aria-label={`${t("Scroll input chart","滚动输入图","Gráfico de desplazamiento")} ${axis.toUpperCase()}, ${unit(mode)}`}><span className={styles.zeroLine}/>{samples.map((sample,i)=><div key={`${sample.at}-${i}`} className={styles.barSlot}><span title={`${sample[axis].toFixed(2)} ${unit(mode)}`} className={sample.opposite?styles.oppositeBar:styles.bar} style={{height:`${Math.abs(sample[axis])/max*45}%`,top:sample[axis]<0?`${50-Math.abs(sample[axis])/max*45}%`:"50%"}}/></div>)}</div>
    </section>
    <SessionReport session={session} tool="wheel" settings={{expectedDirection:expected,units:"raw deltaMode; no pixel conversion"}} hasInput={s.events+s.ignoredZoom>0}>
      <p>{s.events===0?c("noEvents"):expected==="free"?t("Free observation records direction changes without labelling them faults. Choose a one-way test to compare input against your intended direction.","自由观察只记录方向变化，不将其标成故障。切换单向测试可对照你的预期方向。","La observación libre registra cambios sin marcarlos como fallos. Elige una dirección para comparar."):s.eligible===0?t("No input on the selected axis was received. This direction has not been tested.","尚未收到所选轴的输入；该方向尚未完成检测。","No se recibió entrada en el eje elegido. Esa dirección sigue sin probarse."):s.opposite>0?t("Opposite-direction input was received. Repeat slowly, then compare another mouse or USB port before drawing a hardware conclusion.","收到与设定方向相反的输入。建议缓慢复测，再对照其他鼠标或 USB 接口，排除操作与软件因素。","Se recibió entrada opuesta. Repite despacio y compara otro ratón o puerto USB antes de concluir un fallo físico."):t("No opposite input was recorded on the selected axis in this session. Intermittent problems may still require repeat checks.","本轮在所选轴上未记录到反向输入；间歇性问题仍需多次复测。","No hubo entrada opuesta en el eje elegido durante esta sesión. Los problemas intermitentes pueden requerir más pruebas.")}</p>
      <div className={styles.miniStats}><span>{t("Selected-axis events","所选轴有效事件","Eventos del eje elegido")}: {s.eligible}</span><span>{t("Zoom events excluded","已排除缩放输入","Zoom excluido")}: {s.ignoredZoom}</span><span>{t("Zero-delta events","零增量事件","Eventos sin delta")}: {s.zero}</span></div>
      {s.events>0&&<div className={styles.tableScroll}><table><thead><tr><th>{t("Reported unit","报告单位","Unidad recibida")}</th><th>Σ ΔX</th><th>Σ ΔY</th><th>Σ |ΔX|</th><th>Σ |ΔY|</th></tr></thead><tbody>{Object.entries(s.totals).map(([key,total])=><tr key={key}><td>{unit(Number(key))}</td><td>{total.x.toFixed(2)}</td><td>{total.y.toFixed(2)}</td><td>{total.absX.toFixed(2)}</td><td>{total.absY.toFixed(2)}</td></tr>)}</tbody></table></div>}
    </SessionReport>
    <Help><p>{t("Wheel events can come from a mouse or a trackpad; the browser does not reliably identify the source. Inertia, smooth-scrolling software and natural-scrolling settings can affect the result. Ctrl-wheel and pinch-zoom events are excluded.","滚动事件可能来自鼠标或触控板，浏览器不能可靠区分来源。惯性、平滑滚动软件与自然滚动设置可能影响结果；Ctrl 滚轮与触控板缩放输入已排除。","Los eventos pueden venir del ratón o del panel táctil; el navegador no identifica su origen de forma fiable. La inercia y los ajustes de desplazamiento pueden afectar al resultado. Se excluyen Ctrl-rueda y el zoom con pellizco.")}</p><p>{t("Deltas are reported in pixels, lines or pages, depending on the device and browser. They are not physical wheel detents. A webpage cannot detect a turn that never generated an event, or automatically certify that the encoder is healthy.","增量单位可能是像素、行或页，不等于滚轮的物理刻度。若某次转动根本没有生成事件，网页无法感知，也不能自动认证编码器完好。","Los deltas pueden estar en píxeles, líneas o páginas y no equivalen a pasos físicos. La web no detecta giros que no generan eventos ni certifica el estado del codificador.")}</p></Help>
  </>;
}
