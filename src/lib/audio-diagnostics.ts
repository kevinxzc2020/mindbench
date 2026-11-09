/** Digital test signals and measurements, not acoustic SPL or a hardware certification. */
export type AudioChannel = "left" | "right" | "both" | "sequence";
export type ToneKind = "sine" | "sweep" | "white";
export interface ToneOptions { kind: ToneKind; channel: AudioChannel; frequency: number; endFrequency: number; seconds: number; volume: number; sampleRate?: number }
export const RECORDING_LIMIT_SECONDS = 60;
export const RECORDING_BYTE_LIMIT = 32 * 1024 * 1024;
export const bounded = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
export function normalizeTone(o: ToneOptions) {
  const sampleRate = Math.round(bounded(o.sampleRate ?? 48000, 8000, 96000));
  return { ...o, sampleRate, frequency: bounded(o.frequency, 20, Math.min(20000, sampleRate * .45)), endFrequency: bounded(o.endFrequency, 20, Math.min(20000, sampleRate * .45)), seconds: bounded(o.seconds, 1, 10), volume: bounded(o.volume, 0, .5) };
}
export function channelAt(channel: AudioChannel, elapsed: number, total: number): Exclude<AudioChannel,"sequence"> | "silent" {
  if (elapsed < 0 || elapsed >= total) return "silent";
  if (channel !== "sequence") return channel;
  const part = total / 3, index = Math.min(2, Math.floor(elapsed / part));
  // A short quiet gap separates left, right and both without a hard transition.
  if (elapsed % part >= part * .85) return "silent";
  return (["left","right","both"] as const)[index];
}
export function encodeWav(channels: readonly Float32Array[], sampleRate: number): ArrayBuffer {
  if (!channels.length || channels.length > 2 || channels.some(c => c.length !== channels[0].length)) throw new Error("Invalid audio channels");
  if (!Number.isFinite(sampleRate) || sampleRate < 1) throw new Error("Invalid sample rate");
  const length = channels[0].length, count = channels.length;
  const dataSize = length * count * 2;
  const buffer = new ArrayBuffer(44 + dataSize), view = new DataView(buffer);
  const text = (offset: number, value: string) => { for (let i=0;i<value.length;i++) view.setUint8(offset+i,value.charCodeAt(i)); };
  text(0,"RIFF"); view.setUint32(4,36+dataSize,true); text(8,"WAVE"); text(12,"fmt "); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,count,true); view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*count*2,true); view.setUint16(32,count*2,true); view.setUint16(34,16,true); text(36,"data"); view.setUint32(40,dataSize,true);
  for(let i=0;i<length;i++) for(let c=0;c<count;c++) { const n=Number.isFinite(channels[c][i])?bounded(channels[c][i],-1,1):0; view.setInt16(44+(i*count+c)*2,Math.round(n*(n<0?32768:32767)),true); }
  return buffer;
}
export function createTestTone(options: ToneOptions, random: () => number = Math.random) {
  const o = normalizeTone(options), total = o.seconds * (o.channel === "sequence" ? 3 : 1);
  const length = Math.round(total * o.sampleRate), channels = [new Float32Array(length), new Float32Array(length)];
  let phase = 0;
  for(let i=0;i<length;i++) {
    const time=i/o.sampleRate, local=time%o.seconds, route=channelAt(o.channel,time,total);
    const soundLength=o.channel === "sequence"?o.seconds*.85:o.seconds;
    const fade=Math.max(0,Math.min(1,local/.02,(soundLength-local)/.02));
    let value=0;
    if(o.kind==="sine"||o.kind==="sweep") {
      const frequency=o.kind==="sweep"?o.frequency*Math.pow(o.endFrequency/o.frequency,Math.min(1,local/soundLength)):o.frequency;
      phase += 2*Math.PI*frequency/o.sampleRate; phase %= 2*Math.PI; value=Math.sin(phase);
    } else {
      value=(bounded(random(),0,1)*2-1)*.55;
    }
    value*=fade*o.volume;
    if(route==="left"||route==="both") channels[0][i]=value;
    if(route==="right"||route==="both") channels[1][i]=value;
  }
  return { channels, sampleRate:o.sampleRate, duration:total, options:o, wav:encodeWav(channels,o.sampleRate) };
}
export function analyzeSamples(samples: ArrayLike<number>) {
  let sum=0,peak=0,nearFullScale=0,count=0;
  for(let i=0;i<samples.length;i++) { const n=samples[i]; if(!Number.isFinite(n)) continue; const a=Math.abs(n); sum+=n*n; peak=Math.max(peak,a); if(a>=.98) nearFullScale++; count++; }
  const rms=count?Math.sqrt(sum/count):0;
  const db=(n:number)=>n>0?20*Math.log10(n):-Infinity;
  return { rms,peak,rmsDb:db(rms),peakDb:db(peak),nearFullScale,count };
}
export class RecordingClock {
  private accumulated=0; private since:number|null=null;
  start(now:number){this.accumulated=0;this.since=now;}
  pause(now:number){if(this.since!==null){this.accumulated+=Math.max(0,now-this.since);this.since=null;}}
  resume(now:number){if(this.since===null)this.since=now;}
  elapsed(now:number){return this.accumulated+(this.since===null?0:Math.max(0,now-this.since));}
}
export function preferredRecordingType(supports: (mime:string)=>boolean) {
  return ["audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/mp4","audio/webm"].find(supports) ?? "";
}
export function audioExtension(mime:string) { return mime.includes("wav")?"wav":mime.includes("ogg")?"ogg":mime.includes("mp4")?"m4a":mime.includes("webm")?"webm":"audio"; }
export function clockText(seconds:number){const s=Math.max(0,Math.floor(seconds));return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;}
