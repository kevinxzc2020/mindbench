"use client";

import Link from "next/link";
import { useLang } from "@/lib/language-context";
import { INFORMATION_LABELS } from "@/lib/site-information";
import styles from "./AuthPrivacyNotice.module.css";

const COPY = {
  en: {
    title: "Before you continue",
    description: "Your display name and submitted scores may appear publicly in rankings. You can play without an account.",
    draft: "Policies are drafts awaiting operator review. Signing in or registering is not consent to advertising tracking.",
  },
  zh: {
    title: "继续前请了解",
    description: "昵称和提交的成绩可能显示在公开排行榜。你也可以不注册，直接游玩。",
    draft: "政策仍是待运营者确认的草案。登录或注册不代表同意广告跟踪。",
  },
  es: {
    title: "Antes de continuar",
    description: "Tu nombre visible y resultados pueden aparecer en clasificaciones públicas. Puedes jugar sin cuenta.",
    draft: "Las políticas son borradores pendientes de revisión. Acceder o registrarse no implica consentir el seguimiento publicitario.",
  },
};

/** Disclosure precedes both OAuth and email flows; this is not a consent checkbox. */
export function AuthPrivacyNotice() {
  const { lang } = useLang();
  const copy = COPY[lang];
  const labels = INFORMATION_LABELS[lang];
  return (
    <aside className={styles.notice} aria-labelledby="auth-privacy-title">
      <h2 id="auth-privacy-title">{copy.title}</h2>
      <p>{copy.description}</p>
      <div className={styles.links}>
        <Link href="/privacy">{labels.privacy}</Link>
        <Link href="/terms">{labels.terms}</Link>
        <Link href="/privacy-rights">{labels.rights}</Link>
      </div>
      <p className={styles.draft}>{copy.draft}</p>
    </aside>
  );
}
