import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { AuroraBackground } from "@/components/AuroraBackground";

// 编译期 subset + 自托管 —— 不再走 Google CDN @import
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MindBench — Test Your Brain's Limits",
  description:
    "Cognitive tests for reaction time, memory, and visual perception. Challenge your brain and compare with players worldwide.",
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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
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
