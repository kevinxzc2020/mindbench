import { InformationPage } from "@/components/InformationPage";
import { getSiteIdentity } from "@/lib/site-identity";
import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/privacy-rights");

export default function Page() {
  return <InformationPage kind="rights" identity={getSiteIdentity()} />;
}
