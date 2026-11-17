"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/lib/language-context";
import { PrivacyProvider } from "@/components/PrivacyPreferences";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AdSenseAutoAds } from "@/components/AdSenseAutoAds";
import { AdSenseSideRails } from "@/components/AdSenseSideRails";
import { AdSenseAnchor } from "@/components/AdSenseAnchor";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider><PrivacyProvider>{children}<GoogleAnalytics/><AdSenseAutoAds/><AdSenseSideRails/><AdSenseAnchor/></PrivacyProvider></LanguageProvider>
    </SessionProvider>
  );
}
