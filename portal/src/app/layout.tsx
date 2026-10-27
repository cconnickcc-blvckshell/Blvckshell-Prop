import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import { brandAssets } from "@/config/brand-assets";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BLVCKSHELL — Facilities Services",
  description: "BLVCKSHELL facilities services. Public site and workforce operations portal.",
  icons: {
    icon: [
      { url: brandAssets.icons.favicon16, sizes: "16x16", type: "image/png" },
      { url: brandAssets.icons.favicon32, sizes: "32x32", type: "image/png" },
      { url: brandAssets.icons.favicon48, sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: brandAssets.icons.appleTouch180, sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lato.variable}>
      <body className={lato.className}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
