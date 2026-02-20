import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Condo cleaning",
  description: "Common area and lobby cleaning for condos in Windsor-Essex and Ontario. Site-specific checklists and photo evidence.",
};

export default function CondoCleaningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
