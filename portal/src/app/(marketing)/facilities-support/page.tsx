import type { Metadata } from "next";
import ServicePageShell from "@/components/marketing/ServicePageShell";

export const metadata: Metadata = {
  title: "Facilities Support (Conditional)",
  description:
    "Defined, authorized facilities support outside core cleaning—by written scope only. BLVCKSHELL Windsor–Essex.",
};

export default function FacilitiesSupportPage() {
  return (
    <ServicePageShell
      title="Facilities Support (Conditional)"
      subtitle="Limited support services authorized in writing—core business remains commercial cleaning execution."
      heroImageAlt=""
      problem="Property teams occasionally need coordinated support tasks. We offer defined assistance only where scope, licensing, and insurance align—not open-ended maintenance contracting."
      sections={[
        {
          heading: "What may be considered",
          body: "Examples include consumables restocking coordination, minor touch-ups explicitly scoped, or site readiness tasks bundled with cleaning contracts—each requires authorization.",
        },
        {
          heading: "What we do not advertise as standard",
          bullets: [
            "Electrical fixture installation or panel work",
            "HVAC service, refrigerant, or mechanical repair",
            "Plumbing beyond non-licensed minor tasks if ever authorized",
            "Roof access work or unrestricted exterior maintenance",
          ],
        },
      ]}
      exclusions={[
        "Any trade-regulated work without proper licensing and insurance review",
        "Emergency life-safety systems",
      ]}
      completionNote="Support tasks are logged where contracted. Cleaning remains the primary service line."
      serviceInterest="facilities-support"
    />
  );
}
