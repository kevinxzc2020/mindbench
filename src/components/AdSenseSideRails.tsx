"use client";

import { usePathname } from "next/navigation";
import { isAutoAdsRoute } from "@/lib/adsense";
import { AdSenseBanner } from "./AdSenseBanner";

/**
 * Left and right skyscraper ads in the empty page margins. CSS shows them only when the
 * viewport leaves room beside the widest content column (≥1800px), so they never overlap
 * content; hidden rails never request an ad. Same pages as Auto ads: never on games.
 */
export function AdSenseSideRails() {
  const pathname = usePathname() ?? "/";
  if (!isAutoAdsRoute(pathname)) return null;
  return <>
    <div className="side-rail side-rail-left" key={`left-${pathname}`}><AdSenseBanner placement="rail" format="vertical"/></div>
    <div className="side-rail side-rail-right" key={`right-${pathname}`}><AdSenseBanner placement="rail" format="vertical"/></div>
  </>;
}
