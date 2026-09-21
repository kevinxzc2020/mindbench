import type { Metadata } from "next";
import { InformationPage } from "@/components/InformationPage";
import { getSiteIdentity } from "@/lib/site-identity";

export const metadata: Metadata = {
  title: "Contact | MindBench",
};

export default function Page() {
  return <InformationPage kind="contact" identity={getSiteIdentity()} />;
}
