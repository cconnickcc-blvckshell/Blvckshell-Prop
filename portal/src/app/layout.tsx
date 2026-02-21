import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLVCKSHELL — Facilities Services",
  description: "BLVCKSHELL facilities services. Public site and workforce operations portal.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
