import { redirect } from "next/navigation";
import { isLang, localizePath } from "@/lib/i18n";

// 此游戏已移除。这个 stub 保留只为了沙盒里删不掉文件 ——
// 部署前请在本地直接 `rm -rf src/app/[lang]/games/tile-match`。
export default function RemovedTileMatchPage({ params }: { params: { lang: string } }) {
  redirect(isLang(params.lang) ? localizePath(params.lang, "/") : "/");
}
