"use client";

import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import ImageTreatment from "@/components/marketing/ImageTreatment";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";

const IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80";

export default function CondoCleaningPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[50vh] border-b border-zinc-800">
        <ImageTreatment src={IMAGE} alt="Luxury condo lobby" priority className="absolute inset-0">
          <div className="relative z-10 flex min-h-[50vh] flex-col justify-end px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto w-full max-w-4xl">
              <ScrollReveal>
                <h1 className="text-headline font-bold tracking-tight text-white">Condo Cleaning</h1>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                  Common areas, lobbies, washrooms, and shared spaces. Site-specific checklists and evidence designed into every visit from day one.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </ImageTreatment>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <ScrollReveal>
          <h2 className="text-headline font-semibold text-white">Common Areas</h2>
          <p className="mt-4 text-zinc-400">
            Lobbies, hallways, stairwells, elevators, mail rooms, garbage rooms, shared washrooms, and amenity spaces.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white">What's Included</h3>
            <StaggerContainer className="mt-4 space-y-3">
              {[
                "Lobbies and vestibules (floor, glass, desk, bins)",
                "Hallways and corridors (sweep, mop, baseboards)",
                "Stairwells and landings (sweep, mop, railings)",
                "Elevators (interiors, floors, buttons, rails)",
                "Mail rooms and parcel areas",
                "Garbage rooms and recycling areas (floor, bins, deodorize)",
                "Shared washrooms (toilets, sinks, mirrors, sanitize)",
                "Amenity spaces (gyms, lounges, party rooms)",
              ].map((item, i) => (
                <StaggerItem key={i} index={i}>
                  <div className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-white">Cleaning Activities</h3>
            <ul className="mt-4 space-y-2 text-zinc-400">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                Surface cleaning and sanitization
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                Floor care (vacuuming, mopping, spot treatment)
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                Glass and mirror cleaning (ground-level only)
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                Trash and recycling handling
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                Odor control and deodorization
              </li>
            </ul>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="mt-12 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
            <h3 className="text-lg font-semibold text-white">How It Works</h3>
            <p className="mt-4 text-sm text-zinc-400">
              Every visit follows a site-specific checklist designed from day one. Photo evidence is captured per area, logged in our portal, and requires your approval before completion. Frequency is set per contract (2x, 3x, or 5x per week) with a flat monthly fee—no hourly billing.
            </p>
          </div>
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
