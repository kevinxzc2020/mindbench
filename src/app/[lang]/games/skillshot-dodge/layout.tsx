import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/games/skillshot-dodge");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
