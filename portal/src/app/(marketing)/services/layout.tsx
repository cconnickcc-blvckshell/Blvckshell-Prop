import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description: "BLVCKSHELL facilities services: condo cleaning, commercial cleaning, light maintenance.",
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
