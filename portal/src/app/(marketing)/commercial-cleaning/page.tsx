"use client";

import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import ImageTreatment from "@/components/marketing/ImageTreatment";

const IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80";

export default function CommercialCleaningPage() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[50vh] border-b border-zinc-800">
        <ImageTreatment src={IMAGE} alt="Modern commercial office space" priority className="absolute inset-0">
          <div className="relative z-10 flex min-h-[50vh] flex-col justify-end px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto w-full max-w-4xl">
              <ScrollReveal>
                <h1 className="text-headline font-bold tracking-tight text-white">Commercial cleaning</h1>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                  Office, retail, and mixed-use. Scheduled and on-demand cleaning with consistent quality and evidence in the portal.
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
              Lobbies, corridors, and common areas
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Washrooms and break rooms
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Floor care (sweep, mop, vacuum per surface)
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              High-touch surfaces and sanitization
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Trash and recycling removal
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              Scope and checklist per site; completion evidence in the portal
            </li>
          </ul>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="mt-12 text-headline font-semibold text-white">What's excluded</h2>
          <p className="mt-4 text-zinc-400">
            Tenant-only areas unless in scope. Hazmat, specialized equipment (e.g. floor stripping), and after-hours only by agreement. We'll confirm at walkthrough.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <h2 className="mt-12 text-headline font-semibold text-white">Frequency</h2>
          <p className="mt-4 text-zinc-400">
            Daily, several times per week, or weekly—tailored to your building and contract. Service window and days agreed at quote. Flat fee or per-visit pricing.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <h2 className="mt-12 text-headline font-semibold text-white">Add-ons</h2>
          <p className="mt-4 text-zinc-400">
            Deep cleans, carpet cleaning, window interiors, and one-off work orders. Priced per site or per visit—outline your needs in the contact form.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <h2 className="mt-12 text-headline font-semibold text-white">How quoting works</h2>
          <p className="mt-4 text-zinc-400">
            We review your areas and frequency, do a site walk if needed, then send a clear quote. After approval, crews run on schedule and you review completions in the portal.
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
