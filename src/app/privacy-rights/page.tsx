import type { Metadata } from "next";
import { InformationPage } from "@/components/InformationPage";
import { getSiteIdentity } from "@/lib/site-identity";

export const metadata: Metadata = {
  title: "Privacy rights — draft | MindBench",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <InformationPage kind="rights" identity={getSiteIdentity()} />;
}
