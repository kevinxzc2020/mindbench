"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight, Keyboard, Mouse, MoveVertical, Monitor, Headphones, Mic, Camera, Gamepad2, Hand, PenTool, MousePointer2, ScanSearch, History } from "lucide-react";
import { useLang } from "@/lib/language-context";
import type { DiagnosticTool } from "@/lib/device-diagnostics";
import { DEVICE_TOOLS, toolText } from "./diagnostic-copy";
import { useDeviceText } from "./DiagnosticShared";
import { KeyboardTester } from "./KeyboardTester";
import { MouseTester } from "./MouseTester";
import { WheelTester } from "./WheelTester";
import { ScreenTester } from "./ScreenTester";
import { SpeakerTester } from "./SpeakerTester";
import { MicrophoneTester } from "./MicrophoneTester";
import { WebcamTester } from "./WebcamTester";
import { GamepadTester } from "./GamepadTester";
import { PointerTester } from "./PointerTester";
import { EnvironmentTester } from "./EnvironmentTester";
import { DeviceHistory } from "./DeviceHistory";
import styles from "./DeviceDiagnostics.module.css";
import { CheckupJourney } from "./CheckupJourney";

const icons={keyboard:Keyboard,mouse:Mouse,wheel:MoveVertical,screen:Monitor,speakers:Headphones,microphone:Mic,webcam:Camera,gamepad:Gamepad2,touch:Hand,pen:PenTool,trackpad:MousePointer2,environment:ScanSearch,"device-reports":History};
export function DeviceDiagnostics({tool}:{tool:DiagnosticTool}) {
  return tool === "device-reports" ? <DeviceDiagnosticsContent tool={tool}/> : <CheckupJourney key={tool} tool={tool}><DeviceDiagnosticsContent tool={tool}/></CheckupJourney>;
}
function DeviceDiagnosticsContent({tool}:{tool:DiagnosticTool}) {
  const {lang}=useLang(); const {c,t}=useDeviceText(); const Icon=icons[tool]; const router=useRouter();
  const groups: { label: string; ids: DiagnosticTool[] }[] = [
    { label:t("Input devices","输入设备","Dispositivos de entrada"), ids:["keyboard","mouse","wheel","trackpad","gamepad","touch","pen"] },
    { label:t("Screen & sound","屏幕与声音","Pantalla y sonido"), ids:["screen","speakers","microphone","webcam"] },
    { label:t("Environment & records","环境与记录","Entorno e historial"), ids:["environment","device-reports"] },
  ];
  return <div className={styles.shell}>
    <Link href="/collections/devices" className={styles.back}><ArrowLeft size={15}/>{c("back")}</Link>
    <header className={styles.header}><div><p className={styles.eyebrow}><Icon size={17}/> MINDBENCH / DEVICE LAB</p><h1>{toolText(lang,DEVICE_TOOLS[tool].title)}</h1><p>{toolText(lang,DEVICE_TOOLS[tool].intro)}</p></div><div className={styles.labStamp} aria-hidden="true"><Icon size={50} strokeWidth={1}/><span>INPUT / OUTPUT</span></div></header>
    <div className={styles.workspace}>
    <aside className={styles.toolSidebar}>
      <label className={styles.mobileTools}>{t("Switch tool","切换检测工具","Cambiar herramienta")}<select value={tool} onChange={e=>router.push(`/tools/${e.target.value}`)}>{groups.map(group=><optgroup key={group.label} label={group.label}>{group.ids.map(id=><option key={id} value={id}>{toolText(lang,DEVICE_TOOLS[id].title)}</option>)}</optgroup>)}</select></label>
      <nav className={styles.toolNav} aria-label={c("back")}>{groups.map(group=><div key={group.label}><p>{group.label}</p>{group.ids.map(id=>{const ToolIcon=icons[id];return <Link href={`/tools/${id}`} aria-current={id===tool?"page":undefined} key={id}><ToolIcon size={16}/><span>{toolText(lang,DEVICE_TOOLS[id].title)}</span></Link>;})}</div>)}</nav>
    </aside><div className={styles.toolContent}>
    <p className={styles.localNote}>{c("local")}</p>
    {tool==="webcam"?<WebcamTester/>:tool==="gamepad"?<GamepadTester/>:tool==="touch"||tool==="pen"||tool==="trackpad"?<PointerTester tool={tool}/>:tool==="environment"?<EnvironmentTester/>:tool==="device-reports"?<DeviceHistory/>:tool==="speakers"?<SpeakerTester/>:tool==="microphone"?<MicrophoneTester/>:tool==="screen"?<Suspense fallback={<p role="status">{t("Loading screen patterns…","正在加载屏幕图案…","Cargando patrones…")}</p>}><ScreenTester/></Suspense>:tool==="keyboard"?<KeyboardTester/>:tool==="mouse"?<MouseTester/>:<WheelTester/>}
    {tool==="gamepad"&&<p className={styles.sources}><a href="https://www.w3.org/TR/gamepad/" target="_blank" rel="noopener noreferrer">W3C Gamepad · 2025-07-10</a></p>}
    {tool==="webcam"&&<p className={styles.sources}><a href="https://www.w3.org/TR/mediacapture-streams/" target="_blank" rel="noopener noreferrer">W3C Media Capture and Streams · 2025-10-09</a></p>}
    {(tool==="pen"||tool==="touch"||tool==="trackpad")&&<p className={styles.sources}><a href="https://www.w3.org/TR/pointerevents3/" target="_blank" rel="noopener noreferrer">W3C Pointer Events Level 3 · 2026-06-30</a></p>}
    <p className={styles.sources}>{t("Technical references","技术依据","Referencias técnicas")}: {tool==="speakers"||tool==="microphone"?<><a href="https://www.w3.org/TR/webaudio/" target="_blank" rel="noopener noreferrer">W3C Web Audio</a> · <a href="https://www.w3.org/TR/mediacapture-streams/" target="_blank" rel="noopener noreferrer">Media Capture</a> · <a href="https://www.w3.org/TR/mediastream-recording/" target="_blank" rel="noopener noreferrer">MediaStream Recording</a></>:tool==="screen"?<><a href="https://fullscreen.spec.whatwg.org/" target="_blank" rel="noopener noreferrer">WHATWG Fullscreen</a> · <a href="https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames" target="_blank" rel="noopener noreferrer">HTML Animation Frames</a></>:<><a href="https://www.w3.org/TR/uievents/" target="_blank" rel="noopener noreferrer">W3C UI Events</a> · <a href="https://www.w3.org/TR/pointerevents/" target="_blank" rel="noopener noreferrer">W3C Pointer Events</a></>}</p>
  </div></div></div>;
}
