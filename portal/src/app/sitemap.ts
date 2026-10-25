import type { MetadataRoute } from "next";
import { servicesCatalog } from "@/config/marketing-site";

const BASE = "https://www.blvckshell.com";

const staticPaths = [
  "",
  "/services",
  "/our-approach",
  "/90-day-validation",
  "/introductory-offers",
  "/about",
  "/contact",
  "/work-with-us",
  "/client-signup",
  "/compliance",
  "/privacy",
  "/portal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const servicePaths = servicesCatalog.map((s) => s.href);
  const paths = [...new Set([...staticPaths, ...servicePaths])];

  return paths.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
