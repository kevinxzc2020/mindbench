"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeSamples, audioExtension, encodeWav, preferredRecordingType, RECORDING_BYTE_LIMIT, RECORDING_LIMIT_SECONDS, RecordingClock } from "@/lib/audio-diagnostics";
import { audioError } from "./AudioShared";

type Translate=(en:string,zh:string,es:string)=>string;
export type RecordingState="idle"|"recording"|"paused"|"finalizing";
export type MicrophoneCapture = (constraints:MediaStreamConstraints)=>Promise<MediaStream>;
export interface MicClip {url:string;blob:Blob;mime:string;extension:string;seconds:number;label:string;at:string;converted:boolean}
export function useMicrophone(t:Translate,capture?:MicrophoneCapture) {
  const text=useRef(t);text.current=t;
  const [status,setStatus]=useState<"idle"|"requesting"|"active">("idle");
  const [supported,setSupported]=useState<boolean|null>(null),[recordSupported,setRecordSupported]=useState(false);
  const [devices,setDevices]=useState<MediaDeviceInfo[]>([]),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [settings,setSettings]=useState<MediaTrackSettings|null>(null),[label,setLabel]=useState(""),[muted,setMuted]=useState(false);
  const [levels,setLevels]=useState(()=>analyzeSamples(new Float32Array(0))),[peakHold,setPeakHold]=useState(0),[nearWindows,setNearWindows]=useState(0);
  const [recording,setRecording]=useState<RecordingState>("idle"),[elapsed,setElapsed]=useState(0),[clip,setClip]=useState<MicClip|null>(null);
  const mounted=useRef(true),requestId=useRef(0),recordId=useRef(0),stream=useRef<MediaStream|null>(null),context=useRef<AudioContext|null>(null),source=useRef<MediaStreamAudioSourceNode|null>(null),analyser=useRef<AnalyserNode|null>(null),frame=useRef(0),timer=useRef<ReturnType<typeof setInterval>|null>(null),recorder=useRef<MediaRecorder|null>(null),clock=useRef(new RecordingClock()),clipUrl=useRef(""),phase=useRef<RecordingState>("idle"),currentLabel=useRef("");
  const waveform=useRef<Float32Array>(new Float32Array(2048));
  const refresh=useCallback(async()=>{try{const list=await navigator.mediaDevices?.enumerateDevices();if(mounted.current&&list)setDevices(list.filter(d=>d.kind==="audioinput"));}catch{/* No permission prompt is needed to keep using the default input. */}},[]);
  const stopRecording=useCallback(()=>{
    const rec=recorder.current;if(!rec||rec.state==="inactive")return;
    clock.current.pause(performance.now());if(timer.current){clearInterval(timer.current);timer.current=null;}
    phase.current="finalizing";if(mounted.current){setElapsed(clock.current.elapsed(performance.now())/1000);setRecording("finalizing");}
    try{rec.stop();}catch{phase.current="idle";if(mounted.current)setRecording("idle");}
  },[]);
  const stopInput=useCallback(()=>{
    requestId.current++;stopRecording();cancelAnimationFrame(frame.current);
    source.current?.disconnect();source.current=null;analyser.current=null;
    stream.current?.getTracks().forEach(track=>{track.onended=null;track.onmute=null;track.onunmute=null;track.stop();});stream.current=null;
    const ctx=context.current;context.current=null;if(ctx&&ctx.state!=="closed")void ctx.close().catch(()=>{});
    waveform.current.fill(0);if(mounted.current){setStatus("idle");setMuted(false);setNotice("");setLevels(analyzeSamples(new Float32Array(0)));}
  },[stopRecording]);
  useEffect(()=>{
    mounted.current=true;phase.current="idle";recorder.current=null;clipUrl.current="";setStatus("idle");setRecording("idle");setClip(null);setElapsed(0);setLevels(analyzeSamples(new Float32Array(0)));
    setSupported(Boolean(window.isSecureContext&&typeof navigator.mediaDevices?.getUserMedia==="function"&&typeof window.AudioContext==="function"));setRecordSupported(typeof MediaRecorder!=="undefined");void refresh();
    const changed=()=>void refresh();const hidden=()=>{if(document.hidden){stopInput();if(mounted.current)setNotice(text.current("Input stopped because the page is hidden.","页面进入后台，已停止输入并释放麦克风。","La entrada se detuvo al ocultar la página."));}};
    const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")stopInput();};navigator.mediaDevices?.addEventListener("devicechange",changed);document.addEventListener("visibilitychange",hidden);window.addEventListener("keydown",escape);
    return()=>{mounted.current=false;recordId.current++;const rec=recorder.current;if(rec){rec.ondataavailable=null;rec.onstop=null;rec.onerror=null;}stopInput();if(timer.current)clearInterval(timer.current);if(clipUrl.current)URL.revokeObjectURL(clipUrl.current);navigator.mediaDevices?.removeEventListener("devicechange",changed);document.removeEventListener("visibilitychange",hidden);window.removeEventListener("keydown",escape);};
  },[refresh,stopInput]);
  const start=async(deviceId:string,processing:boolean)=>{
    stopInput();const id=++requestId.current;setError("");setNotice("");setStatus("requesting");setSettings(null);setPeakHold(0);setNearWindows(0);
    let ctx:AudioContext|null=null;let input:MediaStream|null=null;
    try {
      if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||!window.AudioContext)throw new DOMException("Unavailable","NotSupportedError");
      ctx=new AudioContext();context.current=ctx;await ctx.resume();
      if(!mounted.current||id!==requestId.current){if(ctx.state!=="closed")await ctx.close();return;}
      setNotice(text.current("Allow microphone access in the browser prompt. If no prompt appears, check the site's microphone permission or cancel and retry in a regular browser.","请在浏览器提示中允许麦克风访问。若没有出现提示，可检查本站麦克风权限，或取消后在普通浏览器中重试。","Permite el micrófono en el aviso del navegador. Si no aparece, revisa el permiso del sitio o cancela y prueba en un navegador normal."));
      const constraints:MediaStreamConstraints={video:false,audio:{...(deviceId?{deviceId:{exact:deviceId}}:{}),channelCount:{ideal:1},echoCancellation:processing,noiseSuppression:processing,autoGainControl:processing}};
      input=await (capture?capture(constraints):navigator.mediaDevices.getUserMedia(constraints));
      if(!mounted.current||id!==requestId.current){input.getTracks().forEach(track=>track.stop());if(ctx.state!=="closed")await ctx.close();return;}
      const track=input.getAudioTracks()[0];if(!track)throw new DOMException("No audio track","NotFoundError");
      stream.current=input;source.current=ctx.createMediaStreamSource(input);const meter=ctx.createAnalyser();meter.fftSize=2048;meter.smoothingTimeConstant=0;source.current.connect(meter);analyser.current=meter;
      // The microphone graph deliberately has no connection to the speakers.
      setSettings(track.getSettings());currentLabel.current=track.label||text.current("Default microphone","默认麦克风","Micrófono predeterminado");setLabel(currentLabel.current);setMuted(track.muted);setStatus("active");setNotice("");void refresh();
      track.onended=()=>{stopInput();if(mounted.current)setError(text.current("The input device disconnected or access ended. Reconnect it, refresh and start again.","输入设备已断开或访问已结束。请重新连接、刷新列表后再开始。","El dispositivo se desconectó o terminó el acceso. Reconéctalo, actualiza e inicia de nuevo."));};
      track.onmute=()=>{if(mounted.current)setMuted(true);};track.onunmute=()=>{if(mounted.current)setMuted(false);};
      ctx.onstatechange=()=>{if(ctx?.state==="suspended"&&id===requestId.current&&mounted.current){stopInput();setNotice(text.current("Audio processing was suspended. Start the input again to resume.","音频处理被浏览器暂停，请重新开始输入。","El navegador suspendió el audio. Inicia la entrada de nuevo."));}};
      const values=new Float32Array(meter.fftSize);let lastUpdate=0;
      const read=(time:number)=>{if(id!==requestId.current||!mounted.current)return;meter.getFloatTimeDomainData(values);waveform.current.set(values);if(time-lastUpdate>=100){const result=analyzeSamples(values);setLevels(result);setPeakHold(p=>Math.max(p,result.peak));if(result.nearFullScale>0)setNearWindows(n=>n+1);lastUpdate=time;}frame.current=requestAnimationFrame(read);};frame.current=requestAnimationFrame(read);
    }catch(e){input?.getTracks().forEach(track=>track.stop());if(ctx&&ctx.state!=="closed")void ctx.close().catch(()=>{});if(mounted.current&&id===requestId.current){stopInput();setError(audioError(e,text.current));}}
  };
  const startRecording=()=>{
    const input=stream.current;if(!input||!input.active||phase.current!=="idle")return;setError("");setNotice("");
    try {
      if(typeof MediaRecorder==="undefined")throw new DOMException("Recorder unavailable","NotSupportedError");
      const mime=preferredRecordingType(value=>MediaRecorder.isTypeSupported(value));const rec=new MediaRecorder(input,mime?{mimeType:mime}:undefined);recorder.current=rec;
      const id=++recordId.current,chunks:Blob[]=[];let bytes=0;const recordedLabel=currentLabel.current,at=new Date().toISOString();
      rec.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);bytes+=e.data.size;if(bytes>=RECORDING_BYTE_LIMIT&&rec.state!=="inactive"){stopRecording();if(mounted.current)setNotice(text.current("Recording stopped at the memory limit.","录音达到内存保护上限，已自动停止。","La grabación alcanzó el límite de memoria y se detuvo."));}}};
      rec.onerror=()=>{if(mounted.current)setError(text.current("Recording was interrupted. Any usable audio will be kept below.","录音被中断，可用的音频会保留在下方。","Se interrumpió la grabación. El audio utilizable aparecerá abajo."));stopInput();};
      rec.onstop=async()=>{
        if(timer.current){clearInterval(timer.current);timer.current=null;}clock.current.pause(performance.now());const recordedSeconds=clock.current.elapsed(performance.now())/1000;
        phase.current="finalizing";if(mounted.current)setRecording("finalizing");
        let blob=new Blob(chunks,{type:rec.mimeType||chunks[0]?.type||"application/octet-stream"}),seconds=recordedSeconds,converted=false;
        try {
          if(!blob.size)throw new Error("empty");
          // WAV conversion gives the local replay a reliable duration and seek bar.
          try {const decoder=new OfflineAudioContext(1,1,48000);const decoded=await decoder.decodeAudioData(await blob.arrayBuffer());if(decoded.numberOfChannels<=2){const channels=Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i));blob=new Blob([encodeWav(channels,decoded.sampleRate)],{type:"audio/wav"});seconds=decoded.duration;converted=true;}}catch{/* Preserve the original supported recording when decoding is unavailable. */}
          if(!mounted.current||id!==recordId.current)return;
          if(clipUrl.current)URL.revokeObjectURL(clipUrl.current);clipUrl.current=URL.createObjectURL(blob);setClip({url:clipUrl.current,blob,mime:blob.type,extension:audioExtension(blob.type),seconds,label:recordedLabel,at,converted});setElapsed(recordedSeconds);
        }catch{if(mounted.current&&id===recordId.current)setError(text.current("No usable recording was received. Start the input and try recording again.","没有收到可用录音，请重新开始输入后再录制。","No se recibió una grabación utilizable. Inicia la entrada y vuelve a grabar."));}
        finally{if(mounted.current&&id===recordId.current){recorder.current=null;phase.current="idle";setRecording("idle");}}
      };
      rec.start(250);clock.current.start(performance.now());phase.current="recording";setRecording("recording");setElapsed(0);
      timer.current=setInterval(()=>{const seconds=clock.current.elapsed(performance.now())/1000;if(mounted.current)setElapsed(seconds);if(seconds>=RECORDING_LIMIT_SECONDS){stopRecording();if(mounted.current)setNotice(text.current("Recording reached the session time limit and stopped automatically.","录音达到本轮时长上限，已自动停止。","La grabación alcanzó el límite de tiempo y se detuvo."));}},100);
    }catch(e){phase.current="idle";setRecording("idle");setError(audioError(e,text.current));}
  };
  const pauseRecording=()=>{const rec=recorder.current;if(rec?.state==="recording"){try{rec.pause();clock.current.pause(performance.now());phase.current="paused";setRecording("paused");}catch(e){setError(audioError(e,text.current));}}};
  const resumeRecording=()=>{const rec=recorder.current;if(rec?.state==="paused"){try{rec.resume();clock.current.resume(performance.now());phase.current="recording";setRecording("recording");}catch(e){setError(audioError(e,text.current));}}};
  const clearClip=()=>{if(phase.current!=="idle")return;if(clipUrl.current)URL.revokeObjectURL(clipUrl.current);clipUrl.current="";setClip(null);};
  return {status,supported,recordSupported,devices,refresh,start,stopInput,error,notice,settings,label,muted,levels,peakHold,nearWindows,waveform,recording,elapsed,clip,startRecording,stopRecording,pauseRecording,resumeRecording,clearClip,resetPeaks:()=>{setPeakHold(0);setNearWindows(0);}};
}
