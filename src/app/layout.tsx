import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "家計簿アプリ",
  description: "プライベート家計簿管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
