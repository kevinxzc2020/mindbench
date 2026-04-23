/**
 * FBX 与贴图放在仓库内 `src/app/resources/pistol`；
 * Three.js 在浏览器里通过 HTTP 加载，需镜像到 `public/resources/pistol`
 *（与 `PistolViewModel.tsx` 里 `PISTOL_FBX_PATH` 一致）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "src", "app", "resources", "pistol");
const dest = path.join(root, "public", "resources", "pistol");

if (!fs.existsSync(src)) {
  console.warn("[sync-pistol-assets] skip: missing", src);
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("[sync-pistol-assets]", path.relative(root, src), "->", path.relative(root, dest));
