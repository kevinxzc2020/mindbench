import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/games/goose-grab");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
