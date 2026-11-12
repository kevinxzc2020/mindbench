import type { Lang } from "./translations";

const text = (en: string, zh: string, es: string): Record<Lang, string> => ({ en, zh, es });
export const CONVERTERS = [
  { id: "image", formats: "PNG · JPG · WEBP", accept: ".png,.jpg,.jpeg,.webp,.bmp", extensions: ["png", "jpg", "jpeg", "webp", "bmp"], title: text("Image converter", "图片格式转换", "Convertir imágenes"), description: text("Convert images, resize and adjust quality. Keep transparency in PNG or WebP.", "转换图片格式、调整尺寸与质量；PNG 和 WebP 可保留透明背景。", "Convierte, redimensiona y ajusta la calidad. Conserva transparencia en PNG o WebP."), category: "image" },
  { id: "images-to-pdf", formats: "IMAGES → PDF", accept: ".png,.jpg,.jpeg,.webp,.bmp", extensions: ["png", "jpg", "jpeg", "webp", "bmp"], title: text("Images to PDF", "图片转 PDF", "Imágenes a PDF"), description: text("Arrange your images and combine them into one PDF, one image per page.", "排列图片顺序，合并为一个 PDF，每张图片对应一页。", "Ordena tus imágenes y combínalas en un PDF, una imagen por página."), category: "pdf" },
  { id: "pdf-to-images", formats: "PDF → PNG / JPG", accept: ".pdf", extensions: ["pdf"], title: text("PDF to images", "PDF 转图片", "PDF a imágenes"), description: text("Render selected PDF pages as PNG or JPG. Download the pages together as a ZIP.", "将指定 PDF 页面导出为 PNG 或 JPG，可打包下载为 ZIP。", "Exporta páginas de PDF a PNG o JPG y descárgalas juntas en un ZIP."), category: "pdf" },
  { id: "audio-to-wav", formats: "AUDIO → WAV", accept: ".mp3,.wav,.m4a,.ogg,.flac,.webm,.aac", extensions: ["mp3", "wav", "m4a", "ogg", "flac", "webm", "aac"], title: text("Audio to WAV", "音频转 WAV", "Audio a WAV"), description: text("Export audio your browser can decode as 16-bit PCM WAV, in mono or stereo.", "将浏览器可解码的音频转为 16 位 PCM WAV，可选单声道或保留双声道。", "Exporta audio compatible con tu navegador a WAV PCM de 16 bits, mono o estéreo."), category: "audio" },
  { id: "csv-to-json", formats: "CSV → JSON", accept: ".csv,.tsv,.txt", extensions: ["csv", "tsv", "txt"], title: text("CSV to JSON", "CSV 转 JSON", "CSV a JSON"), description: text("Turn a UTF-8 table with a header row into JSON records. Values stay as text.", "将带表头的 UTF-8 表格转换为 JSON 对象数组，字段值保持文本。", "Convierte una tabla UTF-8 con encabezados en registros JSON. Los valores siguen siendo texto."), category: "data" },
  { id: "json-to-csv", formats: "JSON → CSV", accept: ".json", extensions: ["json"], title: text("JSON to CSV", "JSON 转 CSV", "JSON a CSV"), description: text("Convert a flat JSON object array to a spreadsheet-friendly UTF-8 CSV.", "将扁平 JSON 对象数组转换为可在表格软件中打开的 UTF-8 CSV。", "Convierte una lista JSON de objetos planos en un CSV UTF-8 para hojas de cálculo."), category: "data" },
] as const;
export type ConverterId = typeof CONVERTERS[number]["id"];
export function getConverter(id: string) { return CONVERTERS.find(tool => tool.id === id); }

// Product limits, not claims about browser capacity. Processing stays local.
export const CONVERSION_LIMITS = { files: 10, fileBytes: 25 * 1024 ** 2, totalBytes: 60 * 1024 ** 2, textBytes: 5 * 1024 ** 2, pixels: 16_000_000, pages: 20, seconds: 600, outputBytes: 100 * 1024 ** 2, rows: 50_000, columns: 1000, cells: 1_000_000 } as const;
export type ConversionErrorCode = "type" | "size" | "total" | "count" | "empty" | "decode" | "pixels" | "pages" | "range" | "password" | "audio" | "duration" | "channels" | "csv" | "headers" | "columns" | "json" | "nested" | "precision" | "animated" | "encoding" | "output" | "cancelled";
export class ConversionError extends Error {
  constructor(public code: ConversionErrorCode) { super(code); this.name = "ConversionError"; }
}
export function validateConversionFile(file: { name: string; size: number }, id: ConverterId) {
  const tool = getConverter(id)!;
  if (!(tool.extensions as readonly string[]).includes(file.name.split(".").pop()?.toLowerCase() ?? "")) throw new ConversionError("type");
  if (!file.size) throw new ConversionError("empty");
  if (file.size > (tool.category === "data" ? CONVERSION_LIMITS.textBytes : CONVERSION_LIMITS.fileBytes)) throw new ConversionError("size");
}
export function outputName(name: string, extension: string) {
  return `${name.replace(/\.[^.]*$/, "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 110) || "converted"}.${extension}`;
}
export function uniqueOutputName(name: string, used: Set<string>) {
  const index = name.lastIndexOf("."), stem = index < 0 ? name : name.slice(0, index), extension = index < 0 ? "" : name.slice(index);
  let result = name, count = 2;
  while (used.has(result.toLowerCase())) result = `${stem}-${count++}${extension}`;
  used.add(result.toLowerCase()); return result;
}
export function imageDimensions(width: number, height: number, maxEdge: number) {
  if (!Number.isFinite(width * height) || width < 1 || height < 1 || width * height > CONVERSION_LIMITS.pixels) throw new ConversionError("pixels");
  const ratio = maxEdge > 0 ? Math.min(1, maxEdge / Math.max(width, height)) : 1;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}
/** Reject animation and check dimensions before asking the browser to decode a raster. */
export function inspectRaster(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, end: number) => String.fromCharCode(...Array.from(bytes.subarray(start, end)));
  if (bytes.length >= 24 && ascii(1, 4) === "PNG" && bytes[0] === 137) {
    imageDimensions(view.getUint32(16), view.getUint32(20), 0);
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset), type = ascii(offset + 4, offset + 8);
      if (type === "acTL") throw new ConversionError("animated");
      if (type === "IDAT") break;
      offset += length + 12;
    }
  } else if (bytes.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    if (ascii(12, 16) === "VP8X") {
      if (bytes[20] & 2) throw new ConversionError("animated");
      const uint24 = (offset: number) => bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65536;
      imageDimensions(uint24(24) + 1, uint24(27) + 1, 0);
    }
  } else if (bytes.length >= 26 && ascii(0, 2) === "BM") {
    const core = view.getUint32(14, true) === 12;
    imageDimensions(core ? view.getUint16(18, true) : Math.abs(view.getInt32(18, true)), core ? view.getUint16(20, true) : Math.abs(view.getInt32(22, true)), 0);
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    for (let offset = 2; offset + 4 < bytes.length;) {
      if (bytes[offset] !== 255) break;
      const marker = bytes[offset + 1];
      if (marker === 218 || marker === 217) break;
      if (marker === 255 || marker === 0) { offset++; continue; }
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + length + 2 > bytes.length) break;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && length >= 7) { imageDimensions(view.getUint16(offset + 7), view.getUint16(offset + 5), 0); break; }
      offset += length + 2;
    }
  } else throw new ConversionError("decode");
}
export function pageSelection(raw: string, count: number): number[] {
  if (!raw.trim()) {
    if (count > CONVERSION_LIMITS.pages) throw new ConversionError("pages");
    return Array.from({ length: count }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  for (const part of raw.split(",")) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part.trim());
    if (!match) throw new ConversionError("range");
    const start = Number(match[1]), end = Number(match[2] ?? match[1]);
    if (start < 1 || end < start || end > count) throw new ConversionError("range");
    if (end - start + 1 > CONVERSION_LIMITS.pages) throw new ConversionError("pages");
    for (let n = start; n <= end; n++) { pages.add(n); if (pages.size > CONVERSION_LIMITS.pages) throw new ConversionError("pages"); }
  }
  return Array.from(pages);
}

export function csvToJson(input: string, delimiter = ",") {
  if (![",", ";", "\t"].includes(delimiter)) throw new ConversionError("csv");
  const source = input.replace(/^\uFEFF/, ""), rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false, closed = false;
  const cell = () => { row.push(field); if (row.length > CONVERSION_LIMITS.columns) throw new ConversionError("size"); field = ""; closed = false; };
  const record = () => { cell(); rows.push(row); row = []; if (rows.length > CONVERSION_LIMITS.rows + 1) throw new ConversionError("size"); };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"') { if (source[i + 1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; } }
      else field += c;
    } else if (c === delimiter) cell();
    else if (c === "\r" || c === "\n") { if (c === "\r" && source[i + 1] === "\n") i++; record(); }
    else if (c === '"' && !field && !closed) quoted = true;
    else { if (closed || c === '"') throw new ConversionError("csv"); field += c; }
  }
  if (quoted) throw new ConversionError("csv");
  if (field || row.length || closed) record();
  if (!rows.length) throw new ConversionError("empty");
  const headers = rows.shift()!;
  if (headers.length * rows.length > CONVERSION_LIMITS.cells) throw new ConversionError("size");
  if (headers.some(h => !h.trim()) || new Set(headers).size !== headers.length) throw new ConversionError("headers");
  return rows.map(values => {
    if (values.length !== headers.length) throw new ConversionError("columns");
    return Object.fromEntries(headers.map((key, i) => [key, values[i]]));
  });
}
export function jsonToCsv(input: string, delimiter = ",", protectFormulas = true) {
  if (![",", ";", "\t"].includes(delimiter)) throw new ConversionError("csv");
  let data: unknown;
  try { data = JSON.parse(input.replace(/^\uFEFF/, "")); } catch { throw new ConversionError("json"); }
  if (!Array.isArray(data) || !data.length || data.length > CONVERSION_LIMITS.rows || data.some(row => !row || typeof row !== "object" || Array.isArray(row))) throw new ConversionError("json");
  const headers = Array.from(new Set<string>(data.flatMap(row => Object.keys(row))));
  if (headers.length > CONVERSION_LIMITS.columns || headers.length * data.length > CONVERSION_LIMITS.cells) throw new ConversionError("size");
  if (!headers.length || headers.some(h => !h.trim())) throw new ConversionError("headers");
  let protectedCells = 0;
  const escape = (value: unknown) => {
    if (value !== null && typeof value === "object") throw new ConversionError("nested");
    if (typeof value === "number" && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) throw new ConversionError("precision");
    let s = value === null || value === undefined ? "" : String(value);
    if (protectFormulas && /^[\s]*[=+@-]/.test(s) && typeof value !== "number") { s = `'${s}`; protectedCells++; }
    return s.includes(delimiter) || /["\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(delimiter), ...data.map(row => headers.map(h => escape(Object.hasOwn(row, h) ? row[h] : "")).join(delimiter))].join("\r\n") + "\r\n";
  return { csv, protectedCells };
}
