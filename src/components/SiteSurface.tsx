"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/language-context";
import type { ReactNode } from "react";

/** Shared laboratory chrome; test stimuli keep their own explicit palettes. */
export function SiteSurface({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { lang } = useLang();
  const cognitive = path === "/daily" || /\/games\/(reaction-time|number-memory|sequence-memory|visual-memory|cps-test|aim-trainer|typing-test|verbal-memory)$/.test(path);
  const activity = path === "/daily" || path.startsWith("/games/") || /^\/(iq-test|mbti|tarot|fortune)(\/|$)/.test(path);
  const label = cognitive
    ? { en: "Cognitive tests", zh: "能力测试", es: "Pruebas cognitivas" }[lang]
    : { en: "Fun & discovery", zh: "趣味探索", es: "Explorar y jugar" }[lang];
  return <div className={`laboratory-surface${activity ? " activity-lab" : ""}`} data-activity={activity ? path.split("/").pop() : undefined}>
    {activity && <nav className="activity-breadcrumb" aria-label={{ en: "Breadcrumb", zh: "当前位置", es: "Ruta de navegación" }[lang]}>
      <Link href={`/collections/${cognitive ? "mind" : "discover"}`}><ArrowLeft size={15} aria-hidden="true" />{label}</Link>
      <ChevronRight size={12} aria-hidden="true" /><span>MINDBENCH LAB</span>
    </nav>}
    {children}
  </div>;
}
