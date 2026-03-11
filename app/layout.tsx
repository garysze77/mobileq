import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MobileQ 卦號",
  description: "電話號碼運勢分析系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body>{children}</body>
    </html>
  );
}
