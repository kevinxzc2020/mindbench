import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { AuroraBackground } from "@/components/AuroraBackground";

export const metadata: Metadata = {
  title: "MindBench — Cognitive training for curious minds",
  description:
    "Short cognitive drills, memory games, precision tests, and a little room for mystery.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="font-sans">
        <AuroraBackground />
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-white/[0.06] py-6 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} MindBench — 测试你的大脑极限
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
