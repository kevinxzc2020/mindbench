import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "MindBench — Test Your Brain's Limits",
  description: "Cognitive tests for reaction time, memory, and visual perception. Challenge your brain and compare with players worldwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} MindBench — 测试你的大脑极限
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
