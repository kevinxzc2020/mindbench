import { routeMetadata } from "@/lib/seo";

export const generateMetadata = routeMetadata("/mbti/characters");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
