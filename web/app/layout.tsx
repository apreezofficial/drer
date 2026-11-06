import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AuraOS — Intelligence at the heart of your system",
  description:
    "Explore AuraOS, an experimental AI-native x86 operating system, and AuraAI, a screen-aware desktop companion. Built in the open by Precious Adedokun.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
