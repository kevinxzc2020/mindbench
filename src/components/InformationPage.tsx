"use client";

import Link from "next/link";
import { ArrowUpRight, Info, Mail } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { INFORMATION_CONTENT, INFORMATION_LABELS, INFORMATION_LINKS, POLICY_DRAFT_UPDATED, type InformationKind } from "@/lib/site-information";
import type { SiteIdentity } from "@/lib/site-identity";
import styles from "./InformationPage.module.css";

const COPY = {
  en: {
    navigation: "Information pages", home: "Back to games", operator: "Operator", contact: "Public contact", operatorMissing: "The responsible operator's identity and required disclosures have not been confirmed.",
    unavailable: "A public contact address has not been configured yet. No message can be submitted from this page.",
    draft: "DRAFT — NOT YET FINALISED", updated: "Draft updated",
    draftNote: "This is a working draft, not a completed legal review. Before launch, the operator must confirm contact details, providers, data retention, applicable requirements and the final wording.",
    links: "Provider & advertising resources", ads: "Google advertising settings", optOut: "Industry advertising opt-out", google: "Google AdSense disclosure requirements", policies: "Related information", googlePrivacy: "Google privacy policy", googlePartners: "How Google uses data from partner sites",
  },
  zh: {
    navigation: "信息页面", home: "返回游戏", operator: "运营者", contact: "公开联系邮箱", operatorMissing: "负责运营的主体身份及应披露信息尚未确认。",
    unavailable: "公开联系邮箱尚未配置，目前无法通过本页提交消息。",
    draft: "待确认草案 · 尚未定稿", updated: "草案更新日期",
    draftNote: "本页为工作草案，不代表法律审核已完成。正式上线前，运营者需确认联系方式、服务商、数据保留安排、适用要求及最终措辞。",
    links: "服务商与广告相关资源", ads: "Google 广告设置", optOut: "行业广告退出设置", google: "Google AdSense 披露要求", policies: "相关信息", googlePrivacy: "Google 隐私政策", googlePartners: "Google 如何使用合作网站的数据",
  },
  es: {
    navigation: "Páginas informativas", home: "Volver a los juegos", operator: "Operador", contact: "Correo de contacto", operatorMissing: "La identidad del operador responsable y las divulgaciones necesarias están pendientes de confirmación.",
    unavailable: "Todavía no se ha configurado un correo público. No se pueden enviar mensajes desde esta página.",
    draft: "BORRADOR — PENDIENTE DE REVISIÓN", updated: "Borrador actualizado",
    draftNote: "Este es un borrador, no una revisión legal finalizada. Antes del lanzamiento, el operador debe confirmar contacto, proveedores, conservación de datos, requisitos aplicables y redacción definitiva.",
    links: "Proveedores y publicidad", ads: "Ajustes publicitarios de Google", optOut: "Opciones de exclusión publicitaria", google: "Requisitos de divulgación de Google AdSense", policies: "Información relacionada", googlePrivacy: "Política de privacidad de Google", googlePartners: "Uso de datos de sitios asociados por Google",
  },
};

export function InformationPage({ kind, identity }: { kind: InformationKind; identity: SiteIdentity }) {
  const { lang } = useLang();
  const content = INFORMATION_CONTENT[lang][kind];
  const copy = COPY[lang];
  const isPolicy = kind !== "about" && kind !== "contact";
  const googleLanguage = lang === "zh" ? "zh-Hans" : lang;
  const policyLanguage = lang === "zh" ? "zh-CN" : lang;
  const resources = [
    { href: `https://policies.google.com/privacy?hl=${policyLanguage}`, label: copy.googlePrivacy },
    { href: `https://policies.google.com/technologies/partner-sites?hl=${policyLanguage}`, label: copy.googlePartners },
    { href: "https://adssettings.google.com/", label: copy.ads },
    { href: "https://www.aboutads.info/choices/", label: copy.optOut },
    { href: `https://support.google.com/adsense/answer/1348695?hl=${googleLanguage}`, label: copy.google },
  ];
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}><span /> MINDBENCH / {INFORMATION_LABELS[lang][kind]}</p>
        <h1>{content.title}</h1><p className={styles.intro}>{content.intro}</p>
        <nav className={styles.navigation} aria-label={copy.navigation}>{INFORMATION_LINKS.map(({ key, href }) => <Link key={key} href={href} aria-current={key === kind ? "page" : undefined}>{INFORMATION_LABELS[lang][key]}</Link>)}</nav>
      </header>

      {isPolicy && <aside className={styles.notice} aria-label={copy.draft}><Info size={19} aria-hidden="true" /><div><strong>{copy.draft}</strong><p>{copy.draftNote}</p><span>{copy.updated}: <time dateTime={POLICY_DRAFT_UPDATED}>{POLICY_DRAFT_UPDATED}</time></span></div></aside>}

      <div className={styles.sections}>{content.sections.map((section, index) => <section key={`${kind}-${index}`} className={styles.section}><div className={styles.sectionTitle}><span>/{String(index + 1).padStart(2, "0")}</span><h2>{section.title}</h2></div><div>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}</div>

      {(kind === "contact" || isPolicy) && <section className={styles.contact} aria-labelledby="public-contact-title">
        <div><p className={styles.eyebrow}>/ CONTACT</p><h2 id="public-contact-title">{copy.contact}</h2></div>
        <div className={styles.contactDetails}>
          {identity.operator ? <p>{copy.operator}: <span>{identity.operator}</span></p> : isPolicy && <p>{copy.operatorMissing}</p>}
          {identity.email ? <a className={styles.email} href={`mailto:${encodeURIComponent(identity.email)}`}><Mail size={17} aria-hidden="true" />{identity.email}<ArrowUpRight size={16} aria-hidden="true" /></a> : <p className={styles.unavailable}>{copy.unavailable}</p>}
        </div>
      </section>}

      {(kind === "privacy" || kind === "cookies" || kind === "rights") && <section className={styles.resources}>
        <h2>{copy.links}</h2>
        {resources.map(({ href, label }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}<ArrowUpRight size={14} aria-hidden="true" /></a>)}
      </section>}

      <div className={styles.bottom}><Link href="/#games">{copy.home}<ArrowUpRight size={17} aria-hidden="true" /></Link>{kind === "about" && <Link href="/privacy">{copy.policies}<ArrowUpRight size={17} aria-hidden="true" /></Link>}</div>
    </article>
  );
}
