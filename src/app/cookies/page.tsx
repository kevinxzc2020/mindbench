import type { Metadata } from "next";
import { InformationPage } from "@/components/InformationPage";
import { getSiteIdentity } from "@/lib/site-identity";

export const metadata: Metadata = {
  title: "Cookies & browser storage — draft | MindBench",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <InformationPage kind="cookies" identity={getSiteIdentity()} />;
}
