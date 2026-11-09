"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowUpRight, Keyboard, Mouse, MoveVertical, Monitor, Headphones, Mic } from "lucide-react";
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
import styles from "./DeviceDiagnostics.module.css";

const icons={keyboard:Keyboard,mouse:Mouse,wheel:MoveVertical,screen:Monitor,speakers:Headphones,microphone:Mic};
export function DeviceDiagnostics({tool}:{tool:DiagnosticTool}) {
  const {lang}=useLang(); const {c,t}=useDeviceText(); const Icon=icons[tool];
  return <div className={styles.shell}>
    <Link href="/collections/devices" className={styles.back}><ArrowLeft size={15}/>{c("back")}</Link>
    <header className={styles.header}><div><p className={styles.eyebrow}><Icon size={17}/> MINDBENCH / DEVICE LAB</p><h1>{toolText(lang,DEVICE_TOOLS[tool].title)}</h1><p>{toolText(lang,DEVICE_TOOLS[tool].intro)}</p></div><div className={styles.labStamp} aria-hidden="true"><Icon size={50} strokeWidth={1}/><span>INPUT / OUTPUT</span></div></header>
    <nav className={styles.toolNav} aria-label={c("back")}>{(Object.keys(DEVICE_TOOLS) as DiagnosticTool[]).map(id=>{const ToolIcon=icons[id];return <Link href={`/tools/${id}`} aria-current={id===tool?"page":undefined} key={id}><ToolIcon size={17}/>{toolText(lang,DEVICE_TOOLS[id].title)}<ArrowUpRight size={14}/></Link>;})}</nav>
    <p className={styles.localNote}>{c("local")}</p>
    {tool==="speakers"?<SpeakerTester/>:tool==="microphone"?<MicrophoneTester/>:tool==="screen"?<Suspense fallback={<p role="status">{t("Loading screen patterns…","正在加载屏幕图案…","Cargando patrones…")}</p>}><ScreenTester/></Suspense>:tool==="keyboard"?<KeyboardTester/>:tool==="mouse"?<MouseTester/>:<WheelTester/>}
    <p className={styles.sources}>{t("Technical references","技术依据","Referencias técnicas")}: {tool==="speakers"||tool==="microphone"?<><a href="https://www.w3.org/TR/webaudio/" target="_blank" rel="noopener noreferrer">W3C Web Audio</a> · <a href="https://www.w3.org/TR/mediacapture-streams/" target="_blank" rel="noopener noreferrer">Media Capture</a> · <a href="https://www.w3.org/TR/mediastream-recording/" target="_blank" rel="noopener noreferrer">MediaStream Recording</a></>:tool==="screen"?<><a href="https://fullscreen.spec.whatwg.org/" target="_blank" rel="noopener noreferrer">WHATWG Fullscreen</a> · <a href="https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames" target="_blank" rel="noopener noreferrer">HTML Animation Frames</a></>:<><a href="https://www.w3.org/TR/uievents/" target="_blank" rel="noopener noreferrer">W3C UI Events</a> · <a href="https://www.w3.org/TR/pointerevents/" target="_blank" rel="noopener noreferrer">W3C Pointer Events</a></>}</p>
  </div>;
}
