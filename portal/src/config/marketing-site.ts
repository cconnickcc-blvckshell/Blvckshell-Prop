/**
 * Single source of truth for public marketing site content and navigation.
 * Do not duplicate these values on individual pages.
 */

export const company = {
  legalName: "BLVCKSHELL Incorporated",
  brandName: "BLVCKSHELL",
  tagline: "Facilities Execution & Accountability",
  commercialLine: "You manage the property. We execute the work.",
  supportingLine: "People. Property. Performance. A Higher Standard.",
  headquarters: "Leamington, Ontario",
  primaryRegion: "Windsor–Essex",
  email: "hello@blvckshell.com",
  /**
   * Vanity display only. Do not infer ownership from BLVK spelling.
   * Dialable E.164: set BUSINESS_PHONE_E164 in env after owner verification.
   */
  phone: {
    displayVanity: "(226) 946-BLVK",
    telE164Verified: null as string | null,
  },
} as const;

export const serviceArea = {
  headline: "Locally focused service",
  primaryCommunities: [
    "Windsor",
    "Leamington",
    "Essex",
    "Kingsville",
    "Amherstburg",
    "Lakeshore",
    "LaSalle",
    "Tecumseh",
  ] as const,
  secondaryNote:
    "Selective opportunities in Chatham–Kent may be considered where authorized.",
} as const;

export type ServiceSlug =
  | "condo-common-area"
  | "commercial-office"
  | "rental-turnovers"
  | "deep-cleaning-resets"
  | "post-construction-final"
  | "facilities-support";

export type ServiceInterestId = ServiceSlug | "paid-pilot" | "90-day-validation" | "general";

export const servicesCatalog: {
  id: ServiceSlug;
  title: string;
  shortDescription: string;
  href: string;
  primary: boolean;
  image?: string;
}[] = [
  {
    id: "condo-common-area",
    title: "Condominium & Common-Area Cleaning",
    shortDescription:
      "Scheduled cleaning for lobbies, corridors, elevators, stairwells, amenities, and agreed common washrooms.",
    href: "/condo-cleaning",
    primary: true,
    image: "/marketing/condo-common-area.jpg",
  },
  {
    id: "commercial-office",
    title: "Commercial & Office Cleaning",
    shortDescription:
      "Offices, reception areas, shared kitchens, washrooms, floors, and commercial common spaces.",
    href: "/commercial-cleaning",
    primary: true,
    image: "/marketing/commercial-interior.jpg",
  },
  {
    id: "rental-turnovers",
    title: "Rental Unit Turnovers",
    shortDescription:
      "Vacant unit cleaning, move-out preparation, and inspection-ready turnover execution.",
    href: "/rental-unit-turnovers",
    primary: true,
    image: "/marketing/commercial-interior.jpg",
  },
  {
    id: "deep-cleaning-resets",
    title: "Deep Cleaning & Building Resets",
    shortDescription:
      "Scoped one-off deep cleaning, neglected common areas, restorative cleaning, and building preparation.",
    href: "/deep-cleaning-building-resets",
    primary: true,
    image: "/marketing/condo-common-area.jpg",
  },
  {
    id: "post-construction-final",
    title: "Post-Construction Final Cleaning",
    shortDescription:
      "Controlled final-stage cleaning for properly prepared construction sites—within defined scope.",
    href: "/post-construction-final-cleaning",
    primary: true,
    image: "/marketing/commercial-interior.jpg",
  },
  {
    id: "facilities-support",
    title: "Facilities Support (Conditional)",
    shortDescription:
      "Defined, authorized support services outside core cleaning—by written scope only.",
    href: "/facilities-support",
    primary: false,
  },
];

export const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/our-approach", label: "Our Approach" },
  { href: "/90-day-validation", label: "90-Day Validation" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const secondaryNav = [
  { href: "/work-with-us", label: "Careers" },
  { href: "/portal", label: "Client Login" },
  { href: "/compliance", label: "Compliance" },
  { href: "/privacy", label: "Privacy" },
] as const;

export const footerNav = [
  { href: "/services", label: "Services" },
  { href: "/our-approach", label: "Our Approach" },
  { href: "/90-day-validation", label: "90-Day Validation" },
  { href: "/introductory-offers", label: "Introductory Offers" },
  { href: "/about", label: "About" },
  { href: "/work-with-us", label: "Careers" },
  { href: "/contact", label: "Contact" },
  { href: "/compliance", label: "Compliance" },
  { href: "/privacy", label: "Privacy" },
  { href: "/portal", label: "Client Login" },
] as const;

export const whoWeServe = [
  {
    title: "Property Managers",
    description:
      "Clear scopes, consistent crews, and documented completion so you can answer owner and board questions with evidence.",
  },
  {
    title: "Condominium Corporations",
    description:
      "Common-area programs built on site-specific instructions—not generic bucket cleaning.",
  },
  {
    title: "Multi-Residential Owners",
    description:
      "Portfolio-friendly scheduling and turnover support without anonymous subcontractor handoffs.",
  },
  {
    title: "Commercial Offices",
    description:
      "Professional presentation for staff and visitors, with agreed frequencies and defined task lists.",
  },
  {
    title: "Developers & Contractors",
    description:
      "Post-construction final cleaning within controlled scope—after trades have completed permitted work.",
  },
] as const;

export const blvckshellDifference = [
  {
    title: "Defined Scope",
    description: "Know what work is included before service begins.",
  },
  {
    title: "Consistent Execution",
    description: "Site-specific instructions and trained service delivery.",
  },
  {
    title: "Documented Completion",
    description: "Service records and appropriate evidence where contracted.",
  },
  {
    title: "Responsive Accountability",
    description: "Clear processes for issues, corrections, and communication.",
  },
] as const;

export const serviceBeginsSteps = [
  {
    step: "1",
    title: "Request an evaluation",
    description: "Tell us about your property and service needs—no visit is scheduled automatically from a form alone.",
  },
  {
    step: "2",
    title: "Site walkthrough & defined scope",
    description: "We align on areas, frequencies, exclusions, and access requirements in writing.",
  },
  {
    step: "3",
    title: "Tailored proposal",
    description: "You receive a clear proposal based on agreed scope—not open-ended hourly guessing.",
  },
  {
    step: "4",
    title: "Authorize service",
    description: "Upon approval, we establish quality expectations and commence scheduled service.",
  },
] as const;

/** Validated service interest IDs for lead attribution (server-side allowlist). */
export const ALLOWED_SERVICE_INTERESTS: ServiceInterestId[] = [
  "general",
  "condo-common-area",
  "commercial-office",
  "rental-turnovers",
  "deep-cleaning-resets",
  "post-construction-final",
  "facilities-support",
  "paid-pilot",
  "90-day-validation",
];

export function contactHref(options?: {
  service?: ServiceInterestId;
  intent?: "quote" | "evaluation" | "sample-report";
}): string {
  const params = new URLSearchParams();
  if (options?.service && options.service !== "general") {
    params.set("service", options.service);
  }
  if (options?.intent) {
    params.set("intent", options.intent);
  }
  const q = params.toString();
  return q ? `/contact?${q}` : "/contact";
}

export function parseServiceInterest(value: string | null | undefined): ServiceInterestId {
  if (!value) return "general";
  return ALLOWED_SERVICE_INTERESTS.includes(value as ServiceInterestId)
    ? (value as ServiceInterestId)
    : "general";
}
