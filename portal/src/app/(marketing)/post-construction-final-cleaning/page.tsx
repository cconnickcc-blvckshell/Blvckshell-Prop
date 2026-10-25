import type { Metadata } from "next";
import ServicePageShell from "@/components/marketing/ServicePageShell";

export const metadata: Metadata = {
  title: "Post-Construction Final Cleaning",
  description:
    "Controlled final-stage cleaning for prepared construction sites in Windsor–Essex. Not hazardous remediation or uncontrolled debris removal.",
};

export default function PostConstructionPage() {
  return (
    <ServicePageShell
      title="Post-Construction Final Cleaning"
      subtitle="Final-stage cleaning after trades complete permitted work and the site is safe to enter under agreed conditions."
      heroImage="/marketing/commercial-interior.jpg"
      heroImageAlt="Commercial interior — illustrative stock photography"
      problem="General contractors and owners need turnover-ready spaces without crossing into trade work, hazmat, or uncontrolled debris hauling."
      sections={[
        {
          heading: "Suitable sites",
          bullets: [
            "Commercial fit-outs at substantial completion",
            "Common-area refresh after approved capital projects",
            "Final clean prior to occupancy when site is broom-clean from trades",
          ],
        },
        {
          heading: "Typical inclusions (when scoped)",
          bullets: [
            "Dust removal from surfaces and fixtures",
            "Floor care appropriate to installed finishes",
            "Interior glass and frames reachable without lift",
            "Washroom and break-area final polish",
          ],
        },
        {
          heading: "Site readiness requirements",
          body: "Construction sites must meet agreed safety and readiness criteria—including utilities, lighting, and debris limits—before mobilization.",
        },
      ]}
      exclusions={[
        "Hazardous remediation or silica/abatement work",
        "Uncontrolled construction debris removal outside scope",
        "Licensed trade corrections (mechanical, electrical, plumbing)",
        "Roof, exterior pressure washing, or high-reach without proper plan",
      ]}
      completionNote="Walkthrough defines punch-list cleaning vs. exclusion list. Documentation supports handoff to owner or GC."
      serviceInterest="post-construction-final"
    />
  );
}
