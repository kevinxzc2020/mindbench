"use client";

import NextLink from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { useLang } from "@/lib/language-context";
import { localizePath } from "@/lib/i18n";

type Href = ComponentProps<typeof NextLink>["href"];

function localizeHref(lang: Parameters<typeof localizePath>[0], href: Href): Href {
  if (typeof href === "string") return localizePath(lang, href);
  if (href.pathname) return { ...href, pathname: localizePath(lang, href.pathname) };
  return href;
}

/**
 * Drop-in replacement for `next/link` that keeps visitors in the current language: internal
 * links get the `/zh` or `/es` prefix, external URLs, `#hash` links and files are left alone.
 */
const LocaleLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function LocaleLink({ href, ...props }, ref) {
  const { lang } = useLang();
  return <NextLink ref={ref} href={localizeHref(lang, href)} {...props} />;
});

export default LocaleLink;
