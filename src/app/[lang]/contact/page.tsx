import { InformationPage } from "@/components/InformationPage";
import { getSiteIdentity } from "@/lib/site-identity";
import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/contact");

export default function Page() {
  return <InformationPage kind="contact" identity={getSiteIdentity()} />;
}
