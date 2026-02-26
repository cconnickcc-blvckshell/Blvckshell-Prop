import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About",
  description: "About BLVCKSHELL facilities services. Who we are and how we're built from day one.",
};

export default function AboutPage() {
  return <AboutClient />;
}
