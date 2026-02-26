"use client";

import Link from "next/link";
import FadeIn from "@/components/animations/FadeIn";
import ScrollReveal from "@/components/animations/ScrollReveal";

const IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600";

export default function CommercialCleaningPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <img
          src={IMAGE}
          alt="Modern commercial office space"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="relative flex h-full items-end pb-12 px-4">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">Commercial Cleaning</h1>
            <p className="mt-2 text-lg text-zinc-400">
              Office, retail, and mixed-use spaces with evidence-based service delivery
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <ScrollReveal>
          <h2 className="text-headline font-semibold text-white">What&apos;s Included</h2>
          <ul className="mt-6 space-y-3 text-zinc-300">
            {[
              "Lobbies, corridors, and common areas",
              "Washrooms and break rooms",
              "Floor care (sweep, mop, vacuum per surface)",
              "High-touch surfaces and sanitization",
              "Trash and recycling removal",
              "Scope and checklist per site; completion evidence in the portal",
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>

        <FadeIn delay={0.1}>
          <h2 className="mt-12 text-headline font-semibold text-white">What&apos;s Excluded</h2>
          <p className="mt-4 text-zinc-400">
            Tenant-only areas unless in scope. Hazmat, specialized equipment (e.g. floor stripping), and after-hours only by agreement. We&apos;ll confirm at walkthrough.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h2 className="mt-12 text-headline font-semibold text-white">Frequency</h2>
          <p className="mt-4 text-zinc-400">
            Daily, several times per week, or weekly&mdash;tailored to your building and contract. Service window and days agreed at quote. Flat fee or per-visit pricing; we avoid hourly billing so scope and incentives stay aligned.
          </p>
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <p className="text-sm text-zinc-300">
              <strong className="text-white">Why we avoid hourly billing:</strong> Hourly billing creates disputes and misaligned incentives. When scope is locked upfront, you know what you&apos;re paying for and we&apos;re incentivized to complete efficiently, not drag out time.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <h2 className="mt-12 text-headline font-semibold text-white">Add-ons</h2>
          <p className="mt-4 text-zinc-400">
            Deep cleans, carpet cleaning, window interiors, and one-off work orders. Priced per site or per visit&mdash;outline your needs in the contact form.
          </p>
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
            <p className="text-sm text-zinc-300">
              <strong className="text-white">Why scope lock matters:</strong> We define scope upfront so there&apos;s no ambiguity about what&apos;s included. Add-ons are quoted separately, preventing scope creep and surprise charges.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <h2 className="mt-12 text-headline font-semibold text-white">How Quoting Works</h2>
          <p className="mt-4 text-zinc-400">
            We review your areas and frequency, do a site walk if needed, then send a clear quote. After approval, crews run on schedule and you review completions in the portal.
          </p>
        </FadeIn>

        <FadeIn delay={0.5}>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link
              href="/contact"
              className="inline-flex justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-500 hover:shadow-lg"
            >
              Request a site evaluation
            </Link>
            <Link
              href="/contact?request=sample-report"
              className="inline-flex justify-center rounded-lg border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800/50"
            >
              See a sample report
            </Link>
            <Link
              href="/services"
              className="inline-flex justify-center rounded-lg border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800/50"
            >
              &larr; Back to services
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
