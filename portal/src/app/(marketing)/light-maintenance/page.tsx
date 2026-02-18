"use client";

import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import ImageTreatment from "@/components/marketing/ImageTreatment";

const IMAGE = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1920&q=80";

export default function LightMaintenancePage() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[50vh] border-b border-zinc-800">
        <ImageTreatment src={IMAGE} alt="Professional facility maintenance" priority className="absolute inset-0">
          <div className="relative z-10 flex min-h-[50vh] flex-col justify-end px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto w-full max-w-4xl">
              <ScrollReveal>
                <h1 className="text-headline font-bold tracking-tight text-white">Light maintenance</h1>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                  Minor repairs, bulb replacement, and site support. Logged and tracked in our portal so you see what was done and when.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </ImageTreatment>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <ScrollReveal>
          <h2 className="text-headline font-semibold text-white">What's included</h2>
          <ul className="mt-6 space-y-3 text-zinc-300">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Bulb replacement (common areas, within reach)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Minor repairs (door hardware, cabinet fixes, small touch-ups)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Filter checks and basic HVAC visual checks where agreed
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Site support (access issues, lockouts, coordination with cleaning)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Work logged in the portal with notes and follow-up when needed
            </li>
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="mt-12 text-headline font-semibold text-white">What's excluded</h2>
          <p className="mt-4 text-zinc-400">
            Licensed trades (electrical, plumbing, HVAC repair), major repairs, and work inside units unless in scope. We escalate to your preferred vendors when needed.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <h2 className="mt-12 text-headline font-semibold text-white">Frequency & add-ons</h2>
          <p className="mt-4 text-zinc-400">
            Can be bundled with cleaning (e.g. "cleaning + bulb check") or scheduled as stand-alone visits. One-off work orders for specific tasks—quoted per job.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <h2 className="mt-12 text-headline font-semibold text-white">How quoting works</h2>
          <p className="mt-4 text-zinc-400">
            We align on scope (what counts as light maintenance at your site), frequency, and any caps. Then we quote and log all work in the portal for your review.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex justify-center rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg"
            >
              Request a quote
            </Link>
            <Link
              href="/services"
              className="inline-flex justify-center rounded-lg border border-zinc-600 bg-zinc-900/50 px-8 py-3.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800/50"
            >
              ← Back to services
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
