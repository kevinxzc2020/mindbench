"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/language-context";
import { INFORMATION_LINKS, INFORMATION_LABELS } from "@/lib/site-information";
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
            <Link href="/" aria-label={copy.home}><Image src="/brand/mindbench-wordmark-v2.png" alt="MindBench" width={180} height={60} sizes="180px" /></Link>
            <p>{copy.intro}</p>
          </div>
          <nav aria-label={copy.nav}><Link href="/collections">{copy.collections}</Link>{INFORMATION_LINKS.map(({ key, href }) => <Link key={key} href={href} aria-current={pathname === href ? "page" : undefined}>{INFORMATION_LABELS[lang][key]}</Link>)}</nav>
        </div>
        <div className={styles.bottom}><span>© {year} MINDBENCH</span><span>TEST. CHECK. EXPLORE.</span></div>
      </div>
    </footer>
  );
}
