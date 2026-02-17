import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLVCKSHELL Workforce Operations Portal",
  description: "Workforce operations portal for BLVCKSHELL Facilities Services",
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
