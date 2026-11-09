import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSamples, audioExtension, channelAt, createTestTone, encodeWav, normalizeTone, preferredRecordingType, RecordingClock, type ToneOptions } from "../src/lib/audio-diagnostics";
const base:ToneOptions={kind:"sine",channel:"left",frequency:440,endFrequency:4000,seconds:1,volume:.1,sampleRate:8000};
test("left and right WAV channels are isolated, while both carries identical signals",()=>{
  for(const channel of ["left","right","both"] as const){const signal=createTestTone({...base,channel});const [l,r]=signal.channels;assert.equal(signal.sampleRate,8000);assert.equal(signal.duration,1);if(channel!=="right")assert.ok(analyzeSamples(l).rms>.06);else assert.ok(l.every(n=>n===0));if(channel!=="left")assert.ok(analyzeSamples(r).rms>.06);else assert.ok(r.every(n=>n===0));if(channel==="both")assert.deepEqual(l,r);}
});
test("sequence has left, right, both stages with quiet boundaries",()=>{
  const {channels,duration,sampleRate}=createTestTone({...base,channel:"sequence"});assert.equal(duration,3);
  for(const [time,route] of [[.4,"left"],[1.4,"right"],[2.4,"both"],[.9,"silent"],[1.9,"silent"],[2.9,"silent"]] as const){assert.equal(channelAt("sequence",time,3),route);const segment=channels.map(c=>analyzeSamples(c.slice(Math.round(time*sampleRate),Math.round((time+.03)*sampleRate))).peak);if(route==="silent")assert.deepEqual(segment,[0,0]);else if(route==="left")assert.equal(segment[1],0);else if(route==="right")assert.equal(segment[0],0);else assert.ok(segment.every(n=>n>0));}
  assert.equal(channelAt("left",-1,1),"silent");assert.equal(channelAt("both",1,1),"silent");
});
test("a pure tone has the requested frequency, gain bounds, and fade-in",()=>{
  const {channels}=createTestTone({...base,frequency:400,volume:.2});const values=channels[0];assert.equal(values[0],0);assert.ok(analyzeSamples(values).peak<=.200001);
  let crossings=0;for(let i=800;i<7200;i++)if(values[i]<=0&&values[i+1]>0)crossings++;
  assert.ok(Math.abs(crossings-320)<=1);assert.ok(Math.abs(values[values.length-1])<.002);
});
test("signal limits constrain duration, amplitude and frequencies below Nyquist",()=>{
  const o=normalizeTone({...base,seconds:999,volume:999,frequency:999999,endFrequency:-10,sampleRate:8000});assert.equal(o.seconds,10);assert.equal(o.volume,.5);assert.equal(o.frequency,3600);assert.equal(o.endFrequency,20);
  const invalid=normalizeTone({...base,volume:NaN,seconds:Infinity});assert.equal(invalid.volume,0);assert.equal(invalid.seconds,1);
});
test("zero gain means silence for every signal type",()=>{for(const kind of ["sine","sweep","white"] as const){const s=createTestTone({...base,kind,volume:0,channel:"both"});assert.ok(s.channels.every(c=>c.every(n=>n===0)));}});
test("sweep frequency rises or falls across time instead of staying fixed",()=>{
  const crosses=(values:Float32Array,start:number,end:number)=>{let n=0;for(let i=start;i<end-1;i++)if(values[i]<=0&&values[i+1]>0)n++;return n;};
  for(const [frequency,endFrequency] of [[100,2000],[2000,100]]){const s=createTestTone({...base,kind:"sweep",frequency,endFrequency});const first=crosses(s.channels[0],800,2400),last=crosses(s.channels[0],5600,7200);assert.ok(frequency<endFrequency?last>first*3:first>last*3);}
});
test("white noise is bounded and does not leak into an inactive channel",()=>{let state=17;const random=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);const s=createTestTone({...base,kind:"white",volume:.5},random);assert.ok(analyzeSamples(s.channels[0]).peak<=.275001);assert.ok(analyzeSamples(s.channels[0]).rms>.1);assert.ok(s.channels[1].every(n=>n===0));});
test("PCM WAV declares the correct length, stereo interleaving and sample rate",()=>{
  const b=encodeWav([new Float32Array([1,-1]),new Float32Array([.5,0])],48000),v=new DataView(b);
  assert.equal(new TextDecoder().decode(b.slice(0,4)),"RIFF");assert.equal(new TextDecoder().decode(b.slice(8,12)),"WAVE");assert.equal(v.getUint16(22,true),2);assert.equal(v.getUint32(24,true),48000);assert.equal(v.getUint32(28,true),192000);assert.equal(v.getUint32(40,true),8);assert.equal(b.byteLength,52);assert.equal(v.getInt16(44,true),32767);assert.equal(v.getInt16(46,true),16384);assert.equal(v.getInt16(48,true),-32768);assert.equal(v.getInt16(50,true),0);
});
test("WAV sanitizes non-finite samples and rejects incompatible channel lengths",()=>{const v=new DataView(encodeWav([new Float32Array([NaN,Infinity,-Infinity,3,-3])],8000));assert.deepEqual([0,1,2,3,4].map(i=>v.getInt16(44+i*2,true)),[0,0,0,32767,-32768]);assert.throws(()=>encodeWav([],48000));assert.throws(()=>encodeWav([new Float32Array(1),new Float32Array(2)],48000));assert.throws(()=>encodeWav([new Float32Array(1)],0));});
test("digital RMS, peak and near-full-scale observations have known reference values",()=>{
  const s=analyzeSamples([1,-1,0,0]);assert.equal(s.peak,1);assert.equal(s.peakDb,0);assert.ok(Math.abs(s.rmsDb+3.0103)<.001);assert.equal(s.nearFullScale,2);assert.equal(s.count,4);
  assert.equal(analyzeSamples([.1,-.1]).rmsDb,-20);assert.equal(analyzeSamples([0,0]).rmsDb,-Infinity);assert.equal(analyzeSamples([NaN,Infinity]).count,0);assert.equal(analyzeSamples([.979]).nearFullScale,0);assert.equal(analyzeSamples([.98]).nearFullScale,1);
});
test("recording clock excludes pauses and does not count a pause twice",()=>{const c=new RecordingClock();c.start(100);assert.equal(c.elapsed(1100),1000);c.pause(1200);c.pause(1500);assert.equal(c.elapsed(5000),1100);c.resume(6000);c.resume(6500);assert.equal(c.elapsed(7000),2100);c.pause(8000);assert.equal(c.elapsed(99999),3100);c.start(10000);assert.equal(c.elapsed(9999),0);});
test("recorder MIME negotiation uses browser support and preserves true file extensions",()=>{assert.equal(preferredRecordingType(m=>m==="audio/mp4"),"audio/mp4");assert.equal(preferredRecordingType(()=>false),"");assert.equal(preferredRecordingType(()=>true),"audio/webm;codecs=opus");assert.equal(audioExtension("audio/ogg;codecs=opus"),"ogg");assert.equal(audioExtension("audio/mp4"),"m4a");assert.equal(audioExtension("audio/webm"),"webm");assert.equal(audioExtension("audio/wav"),"wav");assert.equal(audioExtension("application/octet-stream"),"audio");});
