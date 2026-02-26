"use client";

import Link from "next/link";
import FadeIn from "@/components/animations/FadeIn";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";

export default function AboutClient() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              About BLVCKSHELL
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-8 space-y-4 text-lg leading-relaxed text-zinc-300">
              <p>
                Blvckshell exists because property managers were tired of undocumented work and excuses. We provide facilities services for condos and commercial properties&mdash;cleaning, turnovers, light maintenance&mdash;with consistency, evidence, and ease of review built in.
              </p>
              <p>
                Our operations are structured to produce audit-ready documentation by default. These standards were designed by operators who have worked inside facilities environments where undocumented work created risk, disputes, and board exposure.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-sm text-zinc-300">
                <strong className="text-white">Operating region:</strong> We launch in Windsor-Essex and serve Ontario-wide coverage as we expand. One consistent footprint&mdash;no geographic ambiguity on coverage, staffing, or response times.
              </p>
              <p className="mt-3 text-sm text-zinc-400">
                Our network includes internal crews and vetted subcontractors. All are onboarded with compliance documentation (COI, WSIB) and trained on your scope. Work is assigned, completed, and approved through our portal. Accountability remains with Blvckshell; we don&apos;t subcontract anonymously.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* What We Don't Do — Cards */}
      <section className="border-b border-zinc-800 bg-zinc-900/20 px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h2 className="text-headline font-semibold text-white">What We Don&apos;t Do</h2>
            <p className="mt-4 text-zinc-400">
              Clear boundaries reduce disputes and set expectations.
            </p>
          </FadeIn>
          <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "We do not bill hourly for cleaning\u2014scope and cadence are agreed, then flat or per-visit pricing.",
              "We do not subcontract anonymously\u2014everyone is vetted, documented, and accountable through us.",
              "We do not clean without documentation\u2014every visit is checklist- and evidence-based.",
              "We do not change scope mid-contract without written confirmation.",
            ].map((text, i) => (
              <StaggerItem key={i} index={i}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-700">
                  <div className="flex gap-3">
                    <span className="mt-0.5 text-lg text-red-400" aria-hidden>&times;</span>
                    <p className="text-sm text-zinc-300">{text}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How We're Built — Grid of cards */}
      <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="text-headline font-semibold text-white">How We&apos;re Built</h2>
            <p className="mt-4 text-zinc-400">
              These aren&apos;t promises we&apos;ll add later&mdash;they&apos;re how we operate.
            </p>
          </FadeIn>
          <StaggerContainer className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Accountability Design",
                description: "Every task is photo-verified and logged from day one. Responsibility is assigned, not diffused. When something is missed, there\u2019s a clear path to resolution.",
              },
              {
                title: "Failure-Mode Awareness",
                description: "We\u2019ve thought through what can go wrong\u2014missed visits, quality issues, safety concerns\u2014and built escalation logic and response protocols into our systems.",
              },
              {
                title: "Growth Limits",
                description: "We cap active properties early. This is intentional. We\u2019d rather do fewer sites well than many sites poorly. Quality over scale.",
              },
              {
                title: "Issue Handling Before Complaints",
                description: "Safety and damage issues are reported same day with documented response times. We catch issues early and escalate proactively.",
              },
              {
                title: "Supervision Model",
                description: "Every completion requires approval. Site managers review evidence, checklists, and quality before sign-off. This is how we operate.",
              },
              {
                title: "Audit-Ready by Default",
                description: "Our operations produce audit-ready documentation by default. Every change is logged. Board-ready reporting with complete visit history.",
              },
            ].map((card, i) => (
              <StaggerItem key={i} index={i}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all duration-200 hover:border-zinc-700 hover:shadow-lg hover:shadow-emerald-900/5">
                  <h3 className="font-semibold text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{card.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Why This Matters — Featured blockquote */}
      <section className="border-b border-zinc-800 bg-zinc-900/20 px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h2 className="text-headline font-semibold text-white">Why This Matters</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <blockquote className="mt-10 border-l-4 border-emerald-600 pl-8">
              <p className="text-2xl font-medium leading-relaxed text-zinc-200 sm:text-3xl">
                Property managers hire cleaners to avoid problems, not to admire resumes.
              </p>
              <p className="mt-6 text-lg text-zinc-400">
                Our value is in systems thinking, accountability design, and risk awareness that prevent problems before they happen.
              </p>
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-zinc-950 px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <FadeIn>
            <p className="text-lg text-zinc-400">For custom scope or multi-site programs, get in touch.</p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:bg-emerald-500 hover:shadow-xl hover:scale-[1.02]"
              >
                Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
