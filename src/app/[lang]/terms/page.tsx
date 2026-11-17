import { InformationPage } from "@/components/InformationPage";
import { getSiteIdentity } from "@/lib/site-identity";
import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/terms");

export default function Page() {
  return <InformationPage kind="terms" identity={getSiteIdentity()} />;
}
