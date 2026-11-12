import { CONVERSION_LIMITS, ConversionError, imageDimensions, inspectRaster, outputName, pageSelection, csvToJson, jsonToCsv, type ConverterId } from "./converters";
import { encodeWav } from "./audio-diagnostics";

export interface ConversionOptions {
  format: "png" | "jpeg" | "webp";
  quality: number;
  maxEdge: number;
  pdfPaper: "a4" | "fit";
  pages: string;
  pdfScale: number;
  sampleRate: number;
  mono: boolean;
  delimiter: string;
  protectFormulas: boolean;
}
export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = { format: "png", quality: .9, maxEdge: 0, pdfPaper: "a4", pages: "", pdfScale: 1.5, sampleRate: 44100, mono: false, delimiter: ",", protectFormulas: true };
export interface ConvertedFile { name: string; blob: Blob; kind: "image" | "audio" | "pdf" | "text"; protectedCells?: number; }
const check = (signal: AbortSignal) => { if (signal.aborted) throw new ConversionError("cancelled"); };
const canvasBlob = (canvas: HTMLCanvasElement, type: string, quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => {
  if (!blob || blob.type !== type) reject(new ConversionError("decode")); else resolve(blob);
}, type, quality));
async function imageCanvas(file: File, options: ConversionOptions, white: boolean, signal: AbortSignal) {
  check(signal);
  inspectRaster(new Uint8Array(await file.arrayBuffer())); check(signal);
  const url = URL.createObjectURL(file), image = new Image();
  try {
    image.src = url;
    try { await image.decode(); } catch { throw new ConversionError("decode"); }
    check(signal);
    const size = imageDimensions(image.naturalWidth, image.naturalHeight, options.maxEdge);
    const canvas = document.createElement("canvas"); canvas.width = size.width; canvas.height = size.height;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new ConversionError("decode");
    if (white) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size.width, size.height); }
    ctx.drawImage(image, 0, 0, size.width, size.height);
    return canvas;
  } finally { URL.revokeObjectURL(url); image.src = ""; }
}
export async function imagesToPdf(files: File[], options: ConversionOptions, signal: AbortSignal, progress: (done: number, total: number) => void): Promise<ConvertedFile[]> {
  const { PDFDocument } = await import("pdf-lib"); check(signal);
  const doc = await PDFDocument.create();
  for (const [i, file] of Array.from(files.entries())) {
    const canvas = await imageCanvas(file, options, true, signal);
    try {
      const blob = await canvasBlob(canvas, "image/jpeg", options.quality);
      check(signal);
      const image = await doc.embedJpg(await blob.arrayBuffer());
      const landscape = canvas.width > canvas.height;
      const size: [number, number] = options.pdfPaper === "fit" ? [canvas.width * .75, canvas.height * .75] : landscape ? [841.89, 595.28] : [595.28, 841.89];
      const page = doc.addPage(size), padding = options.pdfPaper === "fit" ? 0 : 24;
      const ratio = Math.min((size[0] - 2 * padding) / image.width, (size[1] - 2 * padding) / image.height);
      const width = image.width * ratio, height = image.height * ratio;
      page.drawImage(image, { x: (size[0] - width) / 2, y: (size[1] - height) / 2, width, height });
    } finally { canvas.width = canvas.height = 1; }
    progress(i + 1, files.length);
  }
  const data = await doc.save(); check(signal);
  return [{ name: files.length === 1 ? outputName(files[0].name, "pdf") : "combined-images.pdf", blob: new Blob([new Uint8Array(data)], { type: "application/pdf" }), kind: "pdf" }];
}
async function pdfToImages(file: File, options: ConversionOptions, signal: AbortSignal, progress: (done: number, total: number) => void): Promise<ConvertedFile[]> {
  const pdfjs = await import("pdfjs-dist"); check(signal);
  pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
  const data = await file.arrayBuffer(); check(signal);
  if (!new TextDecoder().decode(data.slice(0, 1024)).includes("%PDF-")) throw new ConversionError("decode");
  const task = pdfjs.getDocument({ data, cMapUrl: "/vendor/pdfjs/cmaps/", cMapPacked: true, standardFontDataUrl: "/vendor/pdfjs/standard_fonts/", wasmUrl: "/vendor/pdfjs/wasm/", iccUrl: "/vendor/pdfjs/iccs/" });
  const abort = () => { void task.destroy(); };
  signal.addEventListener("abort", abort, { once: true });
  try {
    const pdf = await task.promise; check(signal);
    const pages = pageSelection(options.pages, pdf.numPages), outputs: ConvertedFile[] = [];
    let bytes = 0;
    for (const [i, number] of Array.from(pages.entries())) {
      check(signal);
      const page = await pdf.getPage(number), viewport = page.getViewport({ scale: options.pdfScale });
      const size = imageDimensions(Math.ceil(viewport.width), Math.ceil(viewport.height), 0);
      const canvas = document.createElement("canvas"); canvas.width = size.width; canvas.height = size.height;
      try {
        await page.render({ canvas, viewport, background: "rgb(255,255,255)" }).promise;
        check(signal);
        const blob = await canvasBlob(canvas, options.format === "jpeg" ? "image/jpeg" : "image/png", options.quality);
        bytes += blob.size; if (bytes > CONVERSION_LIMITS.outputBytes) throw new ConversionError("output");
        outputs.push({ name: outputName(file.name, `page-${number}.${options.format === "jpeg" ? "jpg" : "png"}`), blob, kind: "image" });
      } finally { canvas.width = canvas.height = 1; page.cleanup(); }
      progress(i + 1, pages.length);
    }
    return outputs;
  } catch (error) {
    check(signal);
    if (error instanceof Error && error.name === "PasswordException") throw new ConversionError("password");
    if (error instanceof ConversionError) throw error;
    throw new ConversionError("decode");
  } finally { signal.removeEventListener("abort", abort); await task.destroy(); }
}
async function audioToWav(file: File, options: ConversionOptions, signal: AbortSignal): Promise<ConvertedFile[]> {
  if (typeof OfflineAudioContext === "undefined") throw new ConversionError("audio");
  // Offline decoding needs neither speakers nor microphone permissions.
  const context = new OfflineAudioContext(1, 1, options.sampleRate);
  const bytes = await file.arrayBuffer(); check(signal);
  let buffer: AudioBuffer;
  try { buffer = await context.decodeAudioData(bytes); } catch { throw new ConversionError("audio"); }
  check(signal);
  if (buffer.duration > CONVERSION_LIMITS.seconds) throw new ConversionError("duration");
  if (buffer.numberOfChannels > 2) throw new ConversionError("channels");
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  if (options.mono && channels.length === 2) {
    const mono = new Float32Array(buffer.length);
    for (let i = 0; i < mono.length; i++) mono[i] = (channels[0][i] + channels[1][i]) / 2;
    channels.splice(0, channels.length, mono);
  }
  return [{ name: outputName(file.name, "wav"), blob: new Blob([encodeWav(channels, buffer.sampleRate)], { type: "audio/wav" }), kind: "audio" }];
}
export async function convertFile(file: File, id: ConverterId, options: ConversionOptions, signal: AbortSignal, progress: (done: number, total: number) => void): Promise<ConvertedFile[]> {
  check(signal);
  if (id === "image") {
    const canvas = await imageCanvas(file, options, options.format === "jpeg", signal);
    try { const blob = await canvasBlob(canvas, `image/${options.format}`, options.quality); check(signal); return [{ name: outputName(file.name, options.format === "jpeg" ? "jpg" : options.format), blob, kind: "image" }]; }
    finally { canvas.width = canvas.height = 1; }
  }
  if (id === "pdf-to-images") return pdfToImages(file, options, signal, progress);
  if (id === "audio-to-wav") return audioToWav(file, options, signal);
  if (id === "images-to-pdf") return imagesToPdf([file], options, signal, progress);
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()); } catch { throw new ConversionError("encoding"); }
  check(signal);
  if (id === "csv-to-json") return [{ name: outputName(file.name, "json"), blob: new Blob([JSON.stringify(csvToJson(text, options.delimiter), null, 2)], { type: "application/json" }), kind: "text" }];
  const result = jsonToCsv(text, options.delimiter, options.protectFormulas);
  return [{ name: outputName(file.name, options.delimiter === "\t" ? "tsv" : "csv"), blob: new Blob(["\uFEFF", result.csv], { type: "text/csv;charset=utf-8" }), kind: "text", protectedCells: result.protectedCells }];
}
