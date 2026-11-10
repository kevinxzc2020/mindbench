import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CollectionDetail } from "@/components/CollectionHub";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import { DriverLibrary } from "@/components/drivers/DriverLibrary";
import { collectionRedirect } from "@/lib/collection-navigation";

export function generateStaticParams() { return COLLECTIONS.map(c => ({ slug: c.id })); }
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const collection = getCollection(params.slug);
  return collection ? { title: `${collection.name.en} | MindBench`, description: collection.description.en } : {};
}
export default function CollectionPage({ params }: { params: { slug: string } }) {
  const destination = collectionRedirect(params.slug);
  if (destination) permanentRedirect(destination);
  const collection = getCollection(params.slug);
  if (!collection) notFound();
  return collection.id === "drivers" ? <DriverLibrary/> : <CollectionDetail key={collection.id} id={collection.id} />;
}
