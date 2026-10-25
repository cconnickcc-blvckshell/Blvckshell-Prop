import type { Metadata } from "next";
import MarketingButton from "@/components/marketing/MarketingButton";
import { company, contactHref, serviceArea } from "@/config/marketing-site";

export const metadata: Metadata = {
  title: "About BLVCKSHELL",
  description:
    "Independently operated Canadian commercial cleaning based in Leamington, serving Windsor–Essex with scope discipline and accountable execution.",
};

const boundaries = [
  "We do not present as a property-management company or general contractor.",
  "We do not perform licensed trade work outside authorized, written scope.",
  "We do not offer hazardous-material remediation or unrestricted maintenance contracting.",
  "We do not bill core cleaning on open-ended hourly models—scope and cadence are agreed first.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <h1 className="text-4xl font-bold text-white sm:text-5xl">About {company.brandName}</h1>
      <p className="mt-4 text-lg text-zinc-400">{company.supportingLine}</p>

      <div className="mt-8 space-y-4 leading-relaxed text-zinc-300">
        <p>
          {company.legalName} is an independently operated Canadian commercial cleaning and facilities execution
          company based in {company.headquarters}. Our primary market is {company.primaryRegion}, with selective
          opportunities in Chatham–Kent where authorized.
        </p>
        <p>
          Delivery is employee-led local operations—supported by standardized training, site-specific work
          instructions, quality assurance, and documented completion. Specialist subcontracting may be considered
          separately where authorized; it is not the default staffing model presented to clients.
        </p>
        <p>
          We grow responsibly. We would rather execute fewer properties well than scale into inconsistent service.
          Long-term client relationships matter more than vanity footprint claims.
        </p>
      </div>

      <section className="mt-12 rounded-xl border border-zinc-800 bg-[var(--brand-surface)]/30 p-6">
        <h2 className="text-lg font-semibold text-white">Operating region</h2>
        <p className="mt-3 text-zinc-400">
          {serviceArea.primaryCommunities.join(", ")}, and surrounding communities in {company.primaryRegion}.{" "}
          {serviceArea.secondaryNote}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-headline font-semibold text-white">What we are not</h2>
        <ul className="mt-4 space-y-3 text-zinc-400">
          {boundaries.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-[var(--brand-gold)]" aria-hidden>
                ×
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <MarketingButton href={contactHref({ intent: "evaluation" })}>Request a Site Evaluation</MarketingButton>
      </div>
    </div>
  );
}
