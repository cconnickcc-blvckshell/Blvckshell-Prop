"use client";

import Link from "next/link";
import FadeIn from "@/components/animations/FadeIn";
import ScrollReveal from "@/components/animations/ScrollReveal";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";

const IMAGE = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600";

export default function CondoCleaningPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <img
          src={IMAGE}
          alt="Modern condominium building"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="relative flex h-full items-end pb-12 px-4">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">Condo Cleaning</h1>
            <p className="mt-2 text-lg text-zinc-400">
              Common area maintenance built on checklists, evidence, and accountability
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <ScrollReveal>
          <h2 className="text-headline font-semibold text-white">Common Areas</h2>
          <p className="mt-4 text-zinc-400">
            Lobbies, hallways, stairwells, elevators, mail rooms, garbage rooms, shared washrooms, and amenity spaces.
          </p>
        </ScrollReveal>

        <FadeIn delay={0.1}>
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white">What&apos;s Included</h3>
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
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-white">Cleaning Activities</h3>
            <ul className="mt-4 space-y-2 text-zinc-400">
              {[
                "Surface cleaning and sanitization",
                "Floor care (vacuuming, mopping, spot treatment)",
                "Glass and mirror cleaning (ground-level only)",
                "Trash and recycling handling",
                "Odor control and deodorization",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-12 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
            <h3 className="text-lg font-semibold text-white">How It Works</h3>
            <p className="mt-4 text-sm text-zinc-400">
              Every visit follows a site-specific checklist. Photo evidence is captured per area, logged in our portal, and requires your approval before completion. Frequency is set per contract (2x, 3x, or 5x per week) with a flat monthly fee&mdash;no hourly billing. Hourly billing creates disputes and misaligned incentives; we don&apos;t use it.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
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
