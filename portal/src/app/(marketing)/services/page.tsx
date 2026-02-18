"use client";

import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";

const SERVICES = [
  {
    href: "/condo-cleaning",
    title: "Condo cleaning",
    summary: "Common areas, lobbies, washrooms, and shared spaces. Site-specific checklists and evidence.",
    included: [
      "Lobby and entrance (floor, glass, desk, bins)",
      "Hallways and stairwells (sweep, mop, baseboards)",
      "Elevators (floor, panel, walls)",
      "Common washrooms (toilets, sinks, mirrors, sanitize)",
      "Garbage rooms (floor, bins, deodorize)",
    ],
    cadence: "2x, 3x, or 5x per week (set per contract)",
  },
  {
    href: "/commercial-cleaning",
    title: "Commercial cleaning",
    summary: "Office, retail, and mixed-use. Scheduled and on-demand cleaning with consistent quality.",
    included: [
      "Lobbies, corridors, and common areas",
      "Washrooms and break rooms",
      "Floor care (sweep, mop, vacuum per surface)",
      "High-touch surfaces and sanitization",
      "Trash and recycling removal",
    ],
    cadence: "Daily, several times per week, or weekly",
  },
  {
    href: "/light-maintenance",
    title: "Light maintenance",
    summary: "Minor repairs, bulb replacement, and site support. Logged and tracked in our portal.",
    included: [
      "Bulb replacement (common areas, within reach)",
      "Minor repairs (door hardware, cabinet fixes, touch-ups)",
      "Filter checks and basic HVAC visual checks",
      "Site support (access issues, lockouts, coordination)",
      "Work logged in portal with notes",
    ],
    cadence: "Bundled with cleaning or stand-alone visits",
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <ScrollReveal>
        <h1 className="text-headline font-bold text-white">Services</h1>
        <p className="mt-4 text-lg text-zinc-400">
          We deliver cleaning and light maintenance with clear scope, checklists, and evidence so you can review and approve with confidence.
        </p>
      </ScrollReveal>
      <StaggerContainer className="mt-12 space-y-8">
        {SERVICES.map(({ href, title, summary, included, cadence }, i) => (
          <StaggerItem key={href} index={i}>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/70">
              <h2 className="text-headline font-semibold text-white">{title}</h2>
              <p className="mt-3 text-zinc-400">{summary}</p>
              <div className="mt-6">
                <p className="text-sm font-semibold text-zinc-300">What's included:</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                  {included.map((item, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-sm text-zinc-500">Typical cadence: {cadence}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={href}
                  className="inline-block text-sm font-semibold text-white underline decoration-zinc-600 underline-offset-2 transition-colors hover:decoration-white"
                >
                  Learn more →
                </Link>
                <Link
                  href="/contact"
                  className="inline-block text-sm font-semibold text-emerald-400 underline decoration-emerald-500/40 underline-offset-2 transition-colors hover:text-emerald-300 hover:decoration-emerald-400"
                >
                  Schedule a walkthrough
                </Link>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
      <ScrollReveal delay={0.3}>
        <p className="mt-12 text-zinc-500">
          Need a custom scope or multi-site program?{" "}
          <Link href="/contact" className="font-medium text-white underline decoration-zinc-600 underline-offset-2 hover:decoration-white">
            Contact us
          </Link>{" "}
          for a quote.
        </p>
      </ScrollReveal>
    </div>
  );
}
