import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CollectionDetail } from "@/components/CollectionHub";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import { DriverLibrary } from "@/components/drivers/DriverLibrary";
import { collectionRedirect } from "@/lib/collection-navigation";
import { isLang, localizePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

type Params = { lang: string; slug: string };
export function generateStaticParams() { return COLLECTIONS.map(c => ({ slug: c.id })); }
export function generateMetadata({ params }: { params: Params }): Metadata {
  return isLang(params.lang) && getCollection(params.slug) ? pageMetadata(params.lang, `/collections/${params.slug}`) : {};
}
export default function CollectionPage({ params }: { params: Params }) {
  const destination = collectionRedirect(params.slug);
  if (destination) permanentRedirect(isLang(params.lang) ? localizePath(params.lang, destination) : destination);
  const collection = getCollection(params.slug);
  if (!collection) notFound();
  return collection.id === "drivers" ? <DriverLibrary/> : <CollectionDetail key={collection.id} id={collection.id} />;
}
