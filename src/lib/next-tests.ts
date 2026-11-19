import { CATALOG, type CatalogEntry } from "./collections";

/**
 * Where to send someone who has just finished a game. Speed tests lead to each other, memory tests lead to each other, and every
 * other game leads to more games. An id that stops resolving is skipped rather than shown as a broken link.
 */
const AFTER: Record<string, readonly string[]> = {
  "typing-test": ["reaction-time", "cps-test", "aim-trainer"],
  "cps-test": ["reaction-time", "aim-trainer", "typing-test"],
  "reaction-time": ["cps-test", "aim-trainer", "sequence-memory"],
  "aim-trainer": ["reaction-time", "cps-test", "typing-test"],
  "number-memory": ["sequence-memory", "visual-memory", "verbal-memory"],
  "sequence-memory": ["visual-memory", "number-memory", "verbal-memory"],
  "visual-memory": ["sequence-memory", "number-memory", "verbal-memory"],
  "verbal-memory": ["number-memory", "visual-memory", "sequence-memory"],
};
const MORE_GAMES = ["goose-grab", "sheep", "number-chain", "make-seven", "skillshot-dodge", "beat-number"];

/** Ability tests are labelled "test" and everything else "game" when a click on the shelf is counted. */
export const isAbilityTest = (id: string) => CATALOG.mind.some(entry => entry.id === id);

export function nextTests(gameId: string, limit = 3): CatalogEntry[] {
  const ids = (AFTER[gameId] ?? MORE_GAMES).filter(id => id !== gameId);
  const pool = [...CATALOG.mind, ...CATALOG.discover];
  return ids.flatMap(id => { const entry = pool.find(e => e.id === id); return entry?.href ? [entry] : []; }).slice(0, limit);
}
