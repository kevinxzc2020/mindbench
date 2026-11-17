import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/iq-test");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
