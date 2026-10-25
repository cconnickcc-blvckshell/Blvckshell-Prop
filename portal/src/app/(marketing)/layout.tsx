import type { Metadata } from "next";
import MarketingHeader from "@/components/marketing/Header";
import MarketingFooter from "@/components/marketing/Footer";
import MarketingLayoutClient from "@/components/marketing/MarketingLayoutClient";
import MarketingStructuredData from "@/components/marketing/MarketingStructuredData";

export const metadata: Metadata = {
  title: {
    default: "BLVCKSHELL — Commercial Cleaning Windsor–Essex",
    template: "%s",
  },
  description:
    "Commercial cleaning and facilities execution in Windsor–Essex. Condominium common areas, offices, turnovers, and building resets with defined scope.",
  metadataBase: new URL("https://www.blvckshell.com"),
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
      <MarketingStructuredData />
      <MarketingHeader />
      <MarketingLayoutClient>
        <main className="min-h-screen flex-1 bg-zinc-950 text-white">{children}</main>
      </MarketingLayoutClient>
      <MarketingFooter />
    </>
  );
}
