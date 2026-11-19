"use client";

import Link from "@/components/LocaleLink";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { trackGame } from "@/lib/analytics";
import { isAbilityTest, nextTests } from "@/lib/next-tests";

const TITLE = { en: "Try something else next", zh: "接着试试别的", es: "Prueba otra cosa" };

/** Shown under a score so a finished game leads somewhere instead of ending the visit. */
export function NextTests({ gameId }: { gameId: string }) {
  const { lang } = useLang();
  const entries = nextTests(gameId);
  if (!entries.length) return null;
  return <section className="mt-6 text-left" aria-labelledby="next-tests-title">
    <h3 id="next-tests-title" className="text-sm font-semibold text-gray-300">{TITLE[lang]}</h3>
    <ul className="mt-3 grid gap-3 sm:grid-cols-3">
      {entries.map(entry => <li key={entry.id}>
        <Link href={entry.href!} onClick={() => trackGame({ name: "recommendation_click", game: gameId, target: entry.id, kind: isAbilityTest(entry.id) ? "test" : "game" })} className="card grid h-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 transition-colors hover:border-brand-400">
          <span><strong className="block text-white">{entry.title[lang]}</strong><span className="mt-1 block text-xs text-gray-400">{entry.description[lang]}</span></span>
          <ArrowRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-brand-400"/>
        </Link>
      </li>)}
    </ul>
  </section>;
}
