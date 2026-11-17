import { notFound } from "next/navigation";

/** Any URL under a language that matches no page: render the localized 404 inside the site layout. */
export default function UnknownPage() {
  notFound();
}
