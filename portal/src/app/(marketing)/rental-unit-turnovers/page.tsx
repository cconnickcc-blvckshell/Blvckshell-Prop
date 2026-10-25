import type { Metadata } from "next";
import ServicePageShell from "@/components/marketing/ServicePageShell";

export const metadata: Metadata = {
  title: "Rental Unit Turnover Cleaning",
  description:
    "Vacant unit cleaning and inspection-ready turnovers for multi-residential portfolios in Windsor–Essex.",
};

export default function RentalUnitTurnoversPage() {
  return (
    <ServicePageShell
      title="Rental Unit Turnovers"
      subtitle="Vacant unit cleaning, move-out preparation, and inspection-ready execution."
      heroImage="/marketing/commercial-interior.jpg"
      heroImageAlt="Vacant unit interior — illustrative stock photography"
      problem="Turnover delays cost rent. We deliver scoped vacant-unit cleaning with documented completion exceptions—not open-ended ‘make it sparkle’ requests without boundaries."
      sections={[
        {
          heading: "Suitable property types",
          bullets: [
            "Apartment and rental portfolios",
            "Condominium rental units where access is authorized",
            "Multi-unit turnover programs by schedule or call-off",
          ],
        },
        {
          heading: "Typical task categories",
          bullets: [
            "Kitchen and appliance surfaces (exterior)",
            "Bathrooms sanitized and de-scaled where agreed",
            "Floors vacuumed/mopped; baseboards as scoped",
            "Interior windows reachable without specialized equipment",
            "Removal of non-hazardous debris within scope",
          ],
        },
        {
          heading: "How frequency is established",
          body: "Turnovers are scheduled per vacancy event or batched under a portfolio agreement. Scope is confirmed per unit type before pricing.",
        },
      ]}
      exclusions={[
        "Hazardous materials, mold remediation, or biohazard cleaning",
        "Appliance internal repairs, plumbing, or electrical work",
        "Carpet steaming or restoration unless explicitly scoped",
      ]}
      completionNote="Completion notes and agreed photo checkpoints are provided where contracted. Condition exceptions are documented—not assumed."
      serviceInterest="rental-turnovers"
      offerLink={{ href: "/introductory-offers", label: "Introductory paid pilot options" }}
    />
  );
}
