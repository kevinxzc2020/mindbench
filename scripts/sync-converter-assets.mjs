import { cpSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const source = dirname(require.resolve("pdfjs-dist/package.json"));
const target = join(root, "public", "vendor", "pdfjs");
mkdirSync(target, { recursive: true });
for (const folder of ["cmaps", "standard_fonts", "wasm", "iccs"]) cpSync(join(source, folder), join(target, folder), { recursive: true });
cpSync(join(source, "build/pdf.worker.min.mjs"), join(target, "pdf.worker.min.mjs"));
cpSync(join(source, "LICENSE"), join(target, "LICENSE"));
console.log("Local PDF converter assets ready.");
