import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "DRER — An open-source agent for your computer",
  description:
    "An open-source desktop agent in development for Windows, macOS, and Linux. Screen understanding today; voice, desktop actions, and multi-step workflows ahead.",
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
