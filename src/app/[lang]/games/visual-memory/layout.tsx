import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/games/visual-memory");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
