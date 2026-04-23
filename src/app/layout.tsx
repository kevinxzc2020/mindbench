import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "MindBench — 测试你的大脑极限",
  description: "一系列认知能力测试：反应时间、记忆力、视觉感知……挑战你的大脑极限，与全球玩家比较成绩。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
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
