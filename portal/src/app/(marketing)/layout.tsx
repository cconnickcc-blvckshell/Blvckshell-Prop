import type { Metadata } from "next";
import MarketingHeader from "@/components/marketing/Header";
import MarketingFooter from "@/components/marketing/Footer";
import MarketingLayoutClient from "@/components/marketing/MarketingLayoutClient";

export const metadata: Metadata = {
  title: {
    default: "BLVCKSHELL - Facilities Services",
    template: "%s | BLVCKSHELL",
  },
  description:
    "Professional facilities services for condos and commercial properties. Cleaning, light maintenance, and site management.",
  openGraph: {
    title: "BLVCKSHELL - Facilities Services",
    description: "Professional facilities services for condos and commercial properties.",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <MarketingHeader />
      <MarketingLayoutClient>
        <main className="min-h-screen flex-1 bg-zinc-950 text-white">{children}</main>
      </MarketingLayoutClient>
      <MarketingFooter />
    </>
  );
}
