import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";

export const metadata: Metadata = {
  title: "About",
  description: "About BLVCKSHELL facilities services. Who we are and how we're built from day one.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <ScrollReveal>
        <h1 className="text-headline font-bold text-white">About BLVCKSHELL</h1>
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-300">
            <strong>New operator, built deliberately.</strong> Blvckshell is a new facilities services operator, built with controls and structure that are often added later—after mistakes are made. We are starting small, onboarding carefully, and prioritizing repeatable quality over rapid growth.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="mt-8 space-y-4 text-zinc-300">
          <p>
            Blvckshell exists because property managers were tired of undocumented work and excuses. We provide facilities services for condos and commercial properties—cleaning, turnovers, light maintenance—with consistency, evidence, and ease of review built in from day one. Our operations are structured to produce audit-ready documentation by default.
          </p>
          <p>
            <strong className="text-white">Operating region:</strong> We launch in Windsor–Essex and serve Ontario-wide. One consistent footprint—no geographic ambiguity on coverage, staffing, or response times.
          </p>
          <p>
            Our network includes internal crews and vetted subcontractors. All are onboarded with compliance documentation (COI, WSIB) and trained on your scope. Work is assigned, completed, and approved through our portal—one place for scheduling, evidence, and payouts. Accountability remains with Blvckshell; we don’t subcontract anonymously.
          </p>
          <p>
            For custom scope or multi-site programs, get in touch.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <section className="mt-10">
          <h2 className="text-headline font-semibold text-white">What We Don’t Do</h2>
          <p className="mt-4 text-zinc-400">
            Clear boundaries reduce disputes and set expectations.
          </p>
          <ul className="mt-4 space-y-2 text-zinc-300">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden />
              We do not bill hourly for cleaning—scope and cadence are agreed, then flat or per-visit pricing.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden />
              We do not subcontract anonymously—everyone is vetted, documented, and accountable through us.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden />
              We do not clean without documentation—every visit is checklist- and evidence-based.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden />
              We do not change scope mid-contract without written confirmation.
            </li>
          </ul>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <section className="mt-12">
          <h2 className="text-headline font-semibold text-white">How We're Built</h2>
          <p className="mt-4 text-zinc-400">
            These aren't promises we'll add later—these are foundations designed into our operations from day one.
          </p>
          
          <StaggerContainer className="mt-8 space-y-6">
            <StaggerItem index={0}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="font-semibold text-white">Accountability Design</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Every task is designed to be photo-verified and logged from day one. Responsibility is assigned, not diffused. When something is missed, there's a clear path to resolution.
                </p>
              </div>
            </StaggerItem>
            
            <StaggerItem index={1}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="font-semibold text-white">Failure-Mode Awareness</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  We've thought through what can go wrong—missed visits, quality issues, safety concerns—and built escalation logic and response protocols into our systems before they're needed.
                </p>
              </div>
            </StaggerItem>
            
            <StaggerItem index={2}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="font-semibold text-white">Growth Limits</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  We cap active properties early. This isn't a limitation—it's intentional. We'd rather do fewer sites well than many sites poorly. Quality over scale.
                </p>
              </div>
            </StaggerItem>
            
            <StaggerItem index={3}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="font-semibold text-white">Issue Handling Before Complaints</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Safety and damage issues are reported same day with documented response times. We don't wait for complaints—we catch issues early and escalate proactively.
                </p>
              </div>
            </StaggerItem>
            
            <StaggerItem index={4}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="font-semibold text-white">Supervision Model</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Every completion requires approval. Site managers review evidence, checklists, and quality before sign-off. This isn't optional—it's how we operate.
                </p>
              </div>
            </StaggerItem>
            
            <StaggerItem index={5}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="font-semibold text-white">Audit-Ready by Default</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Our operations are structured to produce audit-ready documentation by default. Every change is logged. Complete history of visits, approvals, issues, and resolutions. Board-ready reporting.
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.3}>
        <section className="mt-12">
          <h2 className="text-headline font-semibold text-white">Why This Matters</h2>
          <p className="mt-4 text-zinc-400">
            Property managers hire cleaners to avoid problems, not to admire resumes. Our value isn't in years of experience—it's in systems thinking, accountability design, and risk awareness that prevent problems before they happen.
          </p>
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
            <p className="text-sm text-zinc-300">
              <strong>Transparency:</strong> We're upfront about being new. We're also upfront about being unusually prepared. That combination—honesty plus structure—is rare in this industry.
            </p>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.4}>
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
