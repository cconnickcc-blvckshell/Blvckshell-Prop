import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commercial cleaning",
  description: "Office, retail, and mixed-use cleaning in Windsor–Essex and Ontario. Scheduled and on-demand with consistent quality.",
};

export default function CommercialCleaningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
