import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/games/reaction-time");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
