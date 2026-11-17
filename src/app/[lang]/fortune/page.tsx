import { redirect } from "next/navigation";
import { isLang, localizePath } from "@/lib/i18n";

// 每日运势已移除。这个 stub 保留只为了沙盒里删不掉文件 ——
// 部署前请在本地直接 `rm -rf src/app/[lang]/fortune src/lib/fortune-data.ts`。
export default function RemovedFortunePage({ params }: { params: { lang: string } }) {
  redirect(isLang(params.lang) ? localizePath(params.lang, "/") : "/");
}
