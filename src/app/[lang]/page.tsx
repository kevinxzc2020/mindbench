import { CollectionHub } from "@/components/CollectionHub";
import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/");

export default function HomePage() {
  return <CollectionHub />;
}
