import type { Metadata } from "next";
import ServicePageShell from "@/components/marketing/ServicePageShell";

export const metadata: Metadata = {
  title: "Deep Cleaning & Building Resets",
  description:
    "Scoped one-off deep cleaning and building reset programs for Windsor–Essex condominiums and commercial properties.",
};

export default function DeepCleaningPage() {
  return (
    <ServicePageShell
      title="Deep Cleaning & Building Resets"
      subtitle="Specifically scoped restorative cleaning and building preparation—not recurring maintenance by default."
      heroImage="/marketing/condo-common-area.jpg"
      heroImageAlt="Common area hallway — illustrative stock photography"
      problem="Neglected common areas and seasonal complaint cycles need a defined reset—not an ambiguous ‘deep clean’ that expands on site without authorization."
      sections={[
        {
          heading: "Typical applications",
          bullets: [
            "Post-incident restorative cleaning (non-hazardous)",
            "Pre-board or pre-inspection building preparation",
            "Amenity or garbage room intensive cleaning",
            "First-service baseline before recurring program",
          ],
        },
        {
          heading: "What a standard scope may include",
          body: "Task lists are built from walkthrough findings—surfaces, floors, fixtures, and agreed touch points— with time and access constraints documented.",
        },
        {
          heading: "Establishing scope",
          body: "Reset projects require walkthrough, written scope, and authorization before mobilization. Add-ons are quoted separately.",
        },
      ]}
      exclusions={[
        "Abatement, asbestos, or hazardous remediation",
        "Pressure washing unless separately scoped and equipped",
        "Trade work (HVAC, plumbing, electrical)",
      ]}
      completionNote="Acceptance criteria are defined in the proposal. Follow-up recurring service, if desired, is a separate authorization."
      serviceInterest="deep-cleaning-resets"
      offerLink={{ href: "/90-day-validation", label: "90-Day Validation option" }}
    />
  );
}
