import { CollectionHub } from "@/components/CollectionHub";
import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/collections");

export default function CollectionsPage() { return <CollectionHub directoryOnly />; }
