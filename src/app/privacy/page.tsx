import type { Metadata } from "next";
import { InformationPage } from "@/components/InformationPage";
import { getSiteIdentity } from "@/lib/site-identity";

export const metadata: Metadata = {
  title: "Privacy policy — draft | MindBench",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <InformationPage kind="privacy" identity={getSiteIdentity()} />;
}
