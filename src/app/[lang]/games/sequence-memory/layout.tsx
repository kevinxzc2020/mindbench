import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/games/sequence-memory");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
