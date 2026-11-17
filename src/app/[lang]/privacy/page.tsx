import { InformationPage } from "@/components/InformationPage";
import { getSiteIdentity } from "@/lib/site-identity";
import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/privacy");

export default function Page() {
  return <InformationPage kind="privacy" identity={getSiteIdentity()} />;
}
