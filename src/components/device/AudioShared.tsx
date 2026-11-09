"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Volume2 } from "lucide-react";
import { useDeviceText } from "./DiagnosticShared";
import styles from "./AudioDiagnostics.module.css";

type Translate = (en:string,zh:string,es:string)=>string;
export function audioError(error:unknown,t:Translate) {
  const name=(error as {name?:string})?.name;
  if(name==="NotAllowedError"||name==="SecurityError")return t("Permission was not granted. Allow access in this site's browser settings, then retry.","尚未获得权限。请在浏览器的网站权限中允许访问，然后重试。","No se concedió permiso. Permite el acceso en los ajustes del sitio y vuelve a intentarlo.");
  if(name==="NotFoundError"||name==="DevicesNotFoundError")return t("No matching audio device was found. Connect it and refresh the device list.","没有找到对应的音频设备。请连接设备后刷新列表。","No se encontró el dispositivo. Conéctalo y actualiza la lista.");
  if(name==="NotReadableError"||name==="TrackStartError")return t("The device could not be opened. Check the system privacy settings and whether another app is using it.","无法打开设备，请检查系统隐私设置，以及设备是否正被其他应用占用。","No se pudo abrir el dispositivo. Revisa la privacidad del sistema y si otra aplicación lo está utilizando.");
  if(name==="OverconstrainedError")return t("This device cannot satisfy the requested settings. Select the default device or change processing options.","设备无法满足请求的设置。请改用默认设备或调整处理选项。","El dispositivo no admite los ajustes solicitados. Prueba el predeterminado o cambia las opciones.");
  if(name==="NotSupportedError")return t("This browser does not support this audio operation. Try a current browser or use the system's default device.","当前浏览器不支持此音频操作，请尝试其他浏览器或使用系统默认设备。","El navegador no admite esta operación. Prueba otro navegador o el dispositivo predeterminado.");
  return t("Audio could not be started. Check the connection and browser permissions, then retry.","音频操作未能完成，请检查设备连接与浏览器权限后重试。","No se pudo iniciar el audio. Revisa la conexión y los permisos e inténtalo de nuevo.");
}
export function downloadAudioReport(tool:string,data:unknown) {
  const url=URL.createObjectURL(new Blob([JSON.stringify({tool,exportedAt:new Date().toISOString(),data},null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download=`mindbench-${tool}-${Date.now()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
type RoutedAudio = HTMLAudioElement & {setSinkId?:(id:string)=>Promise<void>};
type OutputDevices = MediaDevices & {selectAudioOutput?:()=>Promise<MediaDeviceInfo>};
export function AudioOutput({audio,beforeChange}:{audio:RefObject<HTMLAudioElement>;beforeChange:()=>void}) {
  const {t}=useDeviceText();const [supported,setSupported]=useState(false),[chooser,setChooser]=useState(false),[devices,setDevices]=useState<MediaDeviceInfo[]>([]),[selected,setSelected]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  const current=useRef("");const alive=useRef(true);const stopRef=useRef(beforeChange);stopRef.current=beforeChange;
  const refresh=useCallback(async()=>{try{const all=await navigator.mediaDevices?.enumerateDevices();if(alive.current&&all){const outputs=all.filter(d=>d.kind==="audiooutput"&&d.deviceId);setDevices(outputs);if(current.current&&!outputs.some(d=>d.deviceId===current.current)){stopRef.current();const el=audio.current as RoutedAudio|null;try{await el?.setSinkId?.("");if(alive.current){current.current="";setSelected("");}}catch{/* Preserve the previous selection and let playback surface the unavailable output. */}}}}catch{/* System default remains available without enumeration permission. */}},[audio]);
  useEffect(()=>{alive.current=true;setSupported(typeof (audio.current as RoutedAudio|null)?.setSinkId==="function");setChooser(typeof (navigator.mediaDevices as OutputDevices|undefined)?.selectAudioOutput==="function");void refresh();const changed=()=>{stopRef.current();void refresh();};navigator.mediaDevices?.addEventListener("devicechange",changed);return()=>{alive.current=false;navigator.mediaDevices?.removeEventListener("devicechange",changed);};},[audio,refresh]);
  const route=async(id:string)=>{const el=audio.current as RoutedAudio|null;if(!el?.setSinkId)return;stopRef.current();await el.setSinkId(id);current.current=id;if(alive.current)setSelected(id);};
  const change=async(id:string)=>{setBusy(true);setError("");try{await route(id);}catch(e){setError(audioError(e,t));}finally{if(alive.current)setBusy(false);}};
  const choose=async()=>{setBusy(true);setError("");stopRef.current();try{const device=await (navigator.mediaDevices as OutputDevices).selectAudioOutput!();await route(device.deviceId);if(alive.current)setDevices(list=>[...list.filter(d=>d.deviceId!==device.deviceId),device]);}catch(e){if(alive.current)setError(audioError(e,t));}finally{if(alive.current)setBusy(false);}};
  return <div className={styles.output}><Volume2 size={18}/><div><label>{t("Playback device","播放设备","Dispositivo de reproducción")}<select disabled={!supported||busy} value={selected} onChange={e=>void change(e.target.value)}><option value="">{t("System default output","系统默认输出","Salida predeterminada del sistema")}</option>{devices.filter(d=>d.deviceId!=="default"&&d.deviceId!=="communications").map((d,i)=><option key={d.deviceId} value={d.deviceId}>{d.label||`${t("Output","输出设备","Salida")} ${i+1}`}</option>)}</select></label><p>{supported?t("Only devices shared by the browser appear here. You can always change output in your system settings.","这里只显示浏览器允许使用的输出设备，也可在系统设置中切换。","Solo aparecen las salidas permitidas por el navegador. También puedes cambiarlas en el sistema."):t("This browser uses the system default output. Change your headphones or speakers in system settings.","此浏览器使用系统默认输出，请在系统设置中切换耳机或音箱。","Este navegador usa la salida predeterminada. Cambia los auriculares o altavoces en los ajustes del sistema.")}</p>{error&&<p role="alert" className={styles.error}>{error}</p>}</div>{chooser&&supported&&<button type="button" disabled={busy} onClick={()=>void choose()}>{t("Choose output…","选择输出设备…","Elegir salida…")}</button>}</div>;
}
