import type { Metadata } from "next";
import ServicePageShell from "@/components/marketing/ServicePageShell";

export const metadata: Metadata = {
  title: "Condominium & Common-Area Cleaning",
  description:
    "Scheduled condominium common-area cleaning in Windsor–Essex: lobbies, corridors, elevators, amenities, and agreed washrooms.",
};

export default function CondoCleaningPage() {
  return (
    <ServicePageShell
      title="Condominium & Common-Area Cleaning"
      subtitle="Scheduled cleaning for shared spaces—built on site-specific scope and accountable execution."
      heroImage="/marketing/condo-common-area.jpg"
      heroImageAlt="Condominium common area — illustrative stock photography"
      problem="Condominium boards and property managers need common areas that reflect care and compliance—without ambiguous ‘full building’ promises that collapse at the garbage room door."
      sections={[
        {
          heading: "Typical areas",
          bullets: [
            "Lobbies, vestibules, and entrances",
            "Corridors, stairwells, and landings",
            "Elevators (cab interiors as scoped)",
            "Mail, parcel, and amenity spaces",
            "Shared washrooms and agreed waste areas",
          ],
        },
        {
          heading: "Cleaning frequency",
          body: "Frequency is set per contract—commonly two to five visits per week depending on traffic, board standards, and scope. Flat or per-visit pricing is agreed upfront.",
        },
        {
          heading: "Completion & communication",
          body: "Where contracted, completion records and agreed evidence support manager review. Issues are communicated through defined escalation paths—not informal texts alone.",
        },
      ]}
      exclusions={[
        "In-unit resident cleaning unless separately contracted",
        "Exterior window cleaning requiring suspended access",
        "Hazardous or biohazard remediation",
      ]}
      completionNote="Service expectations and review steps are established during onboarding and documented in scope."
      serviceInterest="condo-common-area"
      offerLink={{ href: "/90-day-validation", label: "90-Day Validation program" }}
    />
  );
}
