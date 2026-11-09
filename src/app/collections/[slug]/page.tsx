import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionDetail } from "@/components/CollectionHub";
import { COLLECTIONS, getCollection } from "@/lib/collections";

export function generateStaticParams() { return COLLECTIONS.map(c => ({ slug: c.id })); }
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const collection = getCollection(params.slug);
  return collection ? { title: `${collection.name.en} | MindBench`, description: collection.description.en } : {};
}
export default function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = getCollection(params.slug);
  if (!collection) notFound();
  return <CollectionDetail key={collection.id} id={collection.id} />;
}
