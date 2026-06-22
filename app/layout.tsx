import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TimeDesign - 目標連動タスク管理",
  description: "長期目標から日次スケジュールまでをつなぐタイムデザインツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
