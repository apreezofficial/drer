import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
export const metadata: Metadata = {
  title: "DRER — An open-source agent for your computer",
  description:
    "An open-source assistant in development for Windows, macOS, and Linux. Call DRER to plan, remember, automate, and build with your computer and connected tools.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
