import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "BLVCKSHELL — Facilities Services",
    template: "%s | BLVCKSHELL",
  },
  description:
    "Professional facilities services for condos and commercial properties. Cleaning, light maintenance, and site management.",
  openGraph: {
    title: "BLVCKSHELL — Facilities Services",
    description: "Professional facilities services for condos and commercial properties.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
