import type { Lang } from "./translations";
import { GAMES } from "./utils";

export type CollectionId = "mind" | "devices" | "utilities" | "drivers" | "discover";

export const COLLECTION_NAV: readonly { id: CollectionId; name: Record<Lang, string> }[] = [
  { id: "devices", name: { en: "Device checkup", zh: "设备自检", es: "Dispositivos" } },
  { id: "utilities", name: { en: "Utilities", zh: "实用工具", es: "Herramientas" } },
  { id: "drivers", name: { en: "Drivers", zh: "驱动资料", es: "Controladores" } },
  { id: "mind", name: { en: "Ability tests", zh: "能力测试", es: "Capacidades" } },
  { id: "discover", name: { en: "Fun & discovery", zh: "趣味探索", es: "Explorar" } },
];

export const COLLECTION_ALIASES: Readonly<Record<string, CollectionId>> = {
  audio: "utilities",
  play: "discover",
};

export function collectionRedirect(slug: string): string | undefined {
  const id = Object.hasOwn(COLLECTION_ALIASES, slug) ? COLLECTION_ALIASES[slug] : undefined;
  return id ? `/collections/${id}` : undefined;
}

/** Resolve the owning collection for both its landing page and its tools. */
export function activeCollection(pathname: string): CollectionId | undefined {
  const path = pathname.split(/[?#]/)[0];
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "collections") {
    const slug = segments[1];
    return COLLECTION_NAV.find(c => c.id === slug)?.id ??
      (Object.hasOwn(COLLECTION_ALIASES, slug) ? COLLECTION_ALIASES[slug] : undefined);
  }
  if (segments[0] === "tools") return "devices";
  if (segments[0] === "drivers") return "drivers";
  if (["iq-test", "mbti", "tarot"].includes(segments[0])) return "discover";
  if (segments[0] === "daily") return "mind";
  if (segments[0] === "games") {
    if (segments[1] === "minigames") return "discover";
    const game = GAMES.find(g => g.id === segments[1]);
    return game ? game.category === "cognitive" ? "mind" : "discover" : undefined;
  }
}
