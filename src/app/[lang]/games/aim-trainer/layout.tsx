import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/games/aim-trainer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
