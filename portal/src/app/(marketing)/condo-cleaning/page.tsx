"use client";

import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import ImageTreatment from "@/components/marketing/ImageTreatment";

const IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80";

export default function CondoCleaningPage() {
  return (
    <div className="min-h-screen">
      {/* Hero with premium image treatment */}
      <section className="relative min-h-[50vh] border-b border-zinc-800">
        <ImageTreatment src={IMAGE} alt="Luxury condo lobby" priority className="absolute inset-0">
          <div className="relative z-10 flex min-h-[50vh] flex-col justify-end px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto w-full max-w-4xl">
              <ScrollReveal>
                <h1 className="text-headline font-bold tracking-tight text-white">Condo cleaning</h1>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                  Common areas, lobbies, washrooms, and shared spaces. Site-specific checklists and evidence so you know exactly what's done and when.
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
              Lobby and entrance (floor, glass, desk, bins)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Hallways and stairwells (sweep, mop, baseboards)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Elevators (floor, panel, walls)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Common washrooms (toilets, sinks, mirrors, sanitize)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Garbage rooms (floor, bins, deodorize)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Site-specific checklist per job; photo evidence in the portal
            </li>
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="mt-12 text-headline font-semibold text-white">What's excluded</h2>
          <p className="mt-4 text-zinc-400">
            We do not enter resident units. Deep carpet cleaning, hazmat, and window exteriors are add-ons or separate scope. We'll confirm exclusions at site walk.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <h2 className="mt-12 text-headline font-semibold text-white">Frequency</h2>
          <p className="mt-4 text-zinc-400">
            Set per contract: e.g. 2x, 3x, or 5x per week. Service window and days agreed at quote. Flat monthly fee—no hourly billing.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <h2 className="mt-12 text-headline font-semibold text-white">Add-ons</h2>
          <p className="mt-4 text-zinc-400">
            Seasonal deep clean, extra hallway passes, glass door spot cleans, and one-off work orders. Priced per site or per visit—ask in your quote request.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <h2 className="mt-12 text-headline font-semibold text-white">How quoting works</h2>
          <p className="mt-4 text-zinc-400">
            We align on scope (areas, checklist, frequency), do a site walk if helpful, then send a clear quote and schedule. Once approved, work starts and you review completions in the portal.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.5}>
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
