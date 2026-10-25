import type { Metadata } from "next";
import ServicePageShell from "@/components/marketing/ServicePageShell";

export const metadata: Metadata = {
  title: "Commercial & Office Cleaning",
  description:
    "Office and commercial cleaning for Windsor–Essex: reception, workspaces, washrooms, and common areas with defined scope.",
};

export default function CommercialCleaningPage() {
  return (
    <ServicePageShell
      title="Commercial & Office Cleaning"
      subtitle="Professional workspaces, reception areas, and shared facilities—with scope defined before service begins."
      heroImage="/marketing/commercial-interior.jpg"
      heroImageAlt="Commercial office interior — illustrative stock photography"
      problem="Office and commercial tenants expect consistent presentation. Undefined ‘commercial clean’ scopes create disputes—so we document tasks, frequencies, and exclusions first."
      sections={[
        {
          heading: "Typical areas",
          bullets: [
            "Reception and client-facing areas",
            "Workstations and corridors",
            "Washrooms and break rooms",
            "Hard and soft floor care as scoped",
            "High-touch sanitization where agreed",
          ],
        },
        {
          heading: "Frequency",
          body: "Daily, several times per week, or weekly schedules are common. Service windows and after-hours access are agreed during walkthrough.",
        },
        {
          heading: "Pricing approach",
          body: "Flat or per-visit pricing tied to scope—avoiding open-ended hourly billing that misaligns incentives.",
        },
      ]}
      exclusions={[
        "Tenant-only suites outside agreed scope",
        "Floor stripping/refinishing unless separately scoped",
        "Hazmat or industrial process cleaning",
      ]}
      completionNote="Completion expectations and communication channels are set during authorization—not improvised per visit."
      serviceInterest="commercial-office"
    />
  );
}
