"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/language-context";
import { INFORMATION_LINKS, INFORMATION_LABELS } from "@/lib/site-information";
import { COLLECTION_NAV, activeCollection } from "@/lib/collection-navigation";
import styles from "./SiteFooter.module.css";

const COPY = {
  en: { home: "MindBench home", nav: "Site information", intro: "Tests and tools for curious minds.", collections: "Collections" },
  zh: { home: "MindBench 首页", nav: "网站信息", intro: "给好奇心一套测试与工具。", collections: "全部合集" },
  es: { home: "Inicio de MindBench", nav: "Información del sitio", intro: "Pruebas y herramientas para mentes curiosas.", collections: "Colecciones" },
};

export function SiteFooter({ year }: { year: number }) {
  const { lang } = useLang();
  const pathname = usePathname();
  const copy = COPY[lang];
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" aria-label={copy.home}><Image src="/brand/mindbench-laboratory-logo.png" alt="MindBench" width={2172} height={724} sizes="180px" /></Link>
            <p>{copy.intro}</p>
          </div>
          <div className={styles.links}>
            <nav aria-label={copy.collections}>{COLLECTION_NAV.map(item => <Link key={item.id} href={`/collections/${item.id}`} aria-current={activeCollection(pathname) === item.id ? "page" : undefined}>{item.name[lang]}</Link>)}</nav>
            <nav aria-label={copy.nav}>{INFORMATION_LINKS.map(({ key, href }) => <Link key={key} href={href} aria-current={pathname === href ? "page" : undefined}>{INFORMATION_LABELS[lang][key]}</Link>)}</nav>
          </div>
        </div>
        <div className={styles.bottom}><span>© {year} MINDBENCH</span><span>TEST. CHECK. EXPLORE.</span></div>
      </div>
    </footer>
  );
}
