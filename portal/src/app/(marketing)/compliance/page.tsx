import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";

export const metadata: Metadata = {
  title: "Compliance & Risk",
  description: "BLVCKSHELL insurance, WSIB, key control, and what happens when things go wrong. Risk, accountability, and remediation.",
};

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <ScrollReveal>
        <h1 className="text-headline font-bold text-white">Compliance & Risk</h1>
        <p className="mt-4 text-lg text-zinc-400">
          How we handle insurance, keys, incidents, and remediation. One consistent region: Windsor-Essex launch, Ontario-wide coverage as we expand. Our documentation exists to protect you during audits, disputes, and board review.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <section className="mt-12">
          <h2 className="text-headline font-semibold text-white">Insurance & Compliance</h2>
          <ul className="mt-4 space-y-2 text-zinc-300">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <strong>COI (Certificate of Insurance)</strong> - On file and available upon request. We maintain current commercial general liability and relevant coverage for our operations.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <strong>WSIB</strong> - Coverage in place for our workforce. Proof available upon request.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <strong>HST registered</strong> - Invoices and compliance documentation are issued accordingly.
            </li>
          </ul>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <section className="mt-12">
          <h2 className="text-headline font-semibold text-white">Key / FOB Control</h2>
          <p className="mt-4 text-zinc-400">
            We do not take key or FOB access for granted. Our process:
          </p>
          <StaggerContainer className="mt-6 space-y-4">
            {[
              "Sign-out and sign-in tracked per site and per worker.",
              "Keys/FOBs are used only for assigned jobs and returned or logged as per your agreement.",
              "Incident protocol: any loss or concern is reported same day; we document and remediate in line with your requirements.",
            ].map((item, i) => (
              <StaggerItem key={i} index={i}>
                <div className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                  <span className="text-zinc-300">{item}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.3}>
        <section className="mt-12">
          <h2 className="text-headline font-semibold text-white">Risk, Accountability & What Happens When Things Go Wrong</h2>
          <p className="mt-4 text-zinc-400">
            We own the risk narrative so you know exactly what to expect.
          </p>
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="font-semibold text-white">Missed visit</h3>
              <p className="mt-2 text-sm text-zinc-400">
                We have a make-good policy: we return to complete the service or you receive credit as agreed. Missed visits are logged, acknowledged, and remediated-no silent skips.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="font-semibold text-white">Quality failure / re-clean</h3>
              <p className="mt-2 text-sm text-zinc-400">
                If something isn’t done to standard, we return to fix it or you get credit. Response window and remediation are documented. We don’t leave quality disputes open.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="font-semibold text-white">Incident escalation</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Safety and damage issues are reported the same day. We log incident type, response time, and outcome. Escalation chain and follow-up are documented so you have a clear audit trail.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="font-semibold text-white">Documentation retention</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Completion evidence and logs are retained per our retention policy. Dispute-flagged items are retained longer. We can provide a written summary of our retention and dispute-handling process on request.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="font-semibold text-white">Client disputes</h3>
              <p className="mt-2 text-sm text-zinc-400">
                We handle disputes through a defined process: documentation review, timeline of events, and resolution (re-clean, credit, or other agreed outcome). Accountability stays with Blvckshell; we don’t diffuse responsibility to unnamed subcontractors.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.4}>
        <section className="mt-12">
          <h2 className="text-headline font-semibold text-white">Subcontractor Governance</h2>
          <p className="mt-4 text-zinc-400">
            When we use vetted subcontractors, you still get one accountable operator: Blvckshell.
          </p>
          <ul className="mt-4 space-y-2 text-zinc-300">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Vetting: COI, WSIB, and scope alignment before they touch your sites.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Training: Same checklist and documentation standards; they work through our system.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Accountability: We remain the single point of contact and liability to you. You don’t manage subs-we do.
            </li>
          </ul>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.5}>
        <div className="mt-12">
          <Link
            href="/contact"
            className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            Contact us
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
