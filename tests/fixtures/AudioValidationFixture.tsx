"use client";
// Local browser QA fixture: temporarily mount in a development route only.
// This deliberately labelled synthetic source must never be exposed as a real microphone check.
import {useEffect,useRef,useState} from "react";
import {MicrophoneTester} from "@/components/device/MicrophoneTester";
export default function AudioValidation(){
 const contexts=useRef<AudioContext[]>([]),tracks=useRef<MediaStreamTrack[]>([]);const [behavior,setBehavior]=useState("signal"),[state,setState]=useState("");
 useEffect(()=>{const timer=setInterval(()=>setState(tracks.current.map(t=>t.readyState).join(", ")),200);return()=>{clearInterval(timer);tracks.current.forEach(t=>t.stop());contexts.current.forEach(c=>void c.close().catch(()=>{}));};},[]);
 const capture=async()=>{
   if(behavior==="denied")throw new DOMException("Fixture denied","NotAllowedError");
   if(behavior==="missing")throw new DOMException("Fixture missing","NotFoundError");
   if(behavior==="busy")throw new DOMException("Fixture busy","NotReadableError");
   const ctx=new AudioContext();contexts.current.push(ctx);await ctx.resume();const oscillator=ctx.createOscillator(),gain=ctx.createGain(),destination=ctx.createMediaStreamDestination();oscillator.frequency.value=440;gain.gain.value=.1;oscillator.connect(gain);gain.connect(destination);oscillator.start();tracks.current.push(...destination.stream.getTracks());
   if(behavior==="delayed")await new Promise(resolve=>setTimeout(resolve,2500));
   return destination.stream;
 };
 return <div style={{maxWidth:1200,margin:"auto",padding:24}}><aside style={{border:"2px solid orange",padding:16,marginBottom:24}}><h1>QA ONLY · SIMULATED INPUT · NOT A REAL MICROPHONE</h1><label>Capture scenario <select value={behavior} onChange={e=>setBehavior(e.target.value)}><option value="signal">440 Hz test signal</option><option value="denied">Denied permission</option><option value="missing">Missing device</option><option value="busy">Busy device</option><option value="delayed">Delayed permission</option></select></label><p>Fixture track states: {state||"none"}</p><button onClick={()=>tracks.current.at(-1)?.dispatchEvent(new Event("ended"))}>Simulate disconnection</button></aside><MicrophoneTester capture={capture}/></div>;
}
