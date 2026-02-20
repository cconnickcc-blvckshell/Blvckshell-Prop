import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Light maintenance",
  description: "Minor repairs, bulb replacement, and site support in Windsor-Essex and Ontario. Logged and tracked in the portal.",
};

export default function LightMaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
