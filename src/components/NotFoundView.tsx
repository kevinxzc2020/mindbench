"use client";

import Link from "@/components/LocaleLink";
import { useLang } from "@/lib/language-context";

const COPY = {
  en: { title: "This page could not be found.", body: "The link may be old or mistyped. Start from the home page, or browse every check and test.", home: "Back to home", all: "Browse all tools" },
  zh: { title: "找不到这个页面。", body: "链接可能已经过期或输入有误。可以回到首页，或浏览全部检测与测试。", home: "返回首页", all: "浏览全部工具" },
  es: { title: "No se encontró esta página.", body: "El enlace puede ser antiguo o tener un error. Vuelve al inicio o explora todas las pruebas.", home: "Volver al inicio", all: "Ver todas las herramientas" },
};

export function NotFoundView() {
  const { lang } = useLang();
  const copy = COPY[lang];
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-5">
      <p className="text-xs uppercase tracking-widest font-bold opacity-70">404</p>
      <h1 className="text-3xl font-extrabold">{copy.title}</h1>
      <p className="opacity-80">{copy.body}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link href="/" className="btn-ghost px-4 py-2 text-sm">{copy.home}</Link>
        <Link href="/collections" className="btn-ghost px-4 py-2 text-sm">{copy.all}</Link>
      </div>
    </div>
  );
}
