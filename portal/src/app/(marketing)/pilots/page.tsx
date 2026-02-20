"use client";

import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";

const PILOTS = [
  {
    id: "turnover",
    title: "Unit Turnover Pilot",
    description: "Perfect for property managers with frequent move-outs. A complete turnover package designed to prove readiness and quality.",
    scope: [
      "1 vacant unit",
      "Full turnover cleaning",
      "Visual readiness inspection",
      "Minor touch-ups (up to 2 hours included)",
    ],
    duration: "Single unit or 30 days (whichever comes first)",
    convertsTo: "Per-unit turnover pricing or ongoing maintenance",
    bestFor: "PMs with frequent turnovers who need reliable, inspection-ready units",
  },
  {
    id: "problem-building",
    title: "Problem Building Cleaning Pilot",
    description: "For property managers unhappy with current vendors but hesitant to switch. Prove control and consistency without replacing anyone.",
    scope: [
      "1 building only",
      "Common area cleaning",
      "Garbage room + stairwells",
      "Weekly inspection report",
    ],
    duration: "30 days",
    convertsTo: "Monthly recurring cleaning contract",
    bestFor: "PMs with problem buildings who need proof of improvement",
  },
  {
    id: "maintenance",
    title: "Light Maintenance & Punch-List Pilot",
    description: "Consolidate multiple small issues into one accountable vendor. Fixed hours for paint, caulking, hardware fixes, and minor repairs.",
    scope: [
      "Fixed block of labor (6 or 10 hours)",
      "Paint touch-ups",
      "Caulking",
      "Hardware fixes",
      "Minor repairs only",
    ],
    duration: "30 days or hours-based",
    convertsTo: "Hourly maintenance or monthly maintenance retainer",
    bestFor: "PMs drowning in small issues who want one accountable vendor",
  },
  {
    id: "readiness-audit",
    title: "Turnover Readiness Audit Pilot",
    description: "Low-labor, high-trust validation. Perfect if you already have cleaners and painters—we validate readiness, not compete.",
    scope: [
      "1–3 vacant units",
      "Visual inspection only",
      "Photo documentation",
      "Readiness checklist",
      "Trade-required notes",
    ],
    duration: "One inspection cycle",
    convertsTo: "Turnover cleaning, maintenance, or ongoing inspection support",
    bestFor: "PMs who have vendors but need validation and accountability",
  },
  {
    id: "building-reset",
    title: "Building Reset / Seasonal Refresh Pilot",
    description: "A complete reset before board inspections or seasonal complaints. Feels like a fresh start, not a vendor change.",
    scope: [
      "Pressure washing (walkways / entries)",
      "Carpet refresh (common areas)",
      "Light maintenance punch list",
      "Condition report",
    ],
    duration: "Single project (2–7 days)",
    convertsTo: "Ongoing cleaning or seasonal maintenance contracts",
    bestFor: "PMs before board inspections or seasonal complaint cycles",
  },
];

export default function PilotsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <ScrollReveal>
        <h1 className="text-headline font-bold text-white">Pilot Programs</h1>
        <p className="mt-4 text-lg text-zinc-400">
          Scope-locked, time-bound, prepaid or deposit-based. Each pilot converts naturally to ongoing service or ends cleanly.
        </p>
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-300">
            <strong>This is how serious vendors onboard.</strong> You get proof; we get controlled rollout.
          </p>
        </div>
      </ScrollReveal>

      <StaggerContainer className="mt-12 space-y-8">
        {PILOTS.map((pilot, i) => (
          <StaggerItem key={pilot.id} index={i}>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/70">
              <h2 className="text-headline font-semibold text-white">{pilot.title}</h2>
              <p className="mt-3 text-zinc-400">{pilot.description}</p>
              
              <div className="mt-6">
                <p className="text-sm font-semibold text-zinc-300">Pilot scope:</p>
                <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                  {pilot.scope.map((item, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Duration</p>
                  <p className="mt-1 text-sm text-zinc-300">{pilot.duration}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Converts to</p>
                  <p className="mt-1 text-sm text-zinc-300">{pilot.convertsTo}</p>
                </div>
              </div>

              <div className="mt-6 rounded-md bg-zinc-800/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Best for</p>
                <p className="mt-1 text-sm text-zinc-400">{pilot.bestFor}</p>
              </div>

              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-block text-sm font-semibold text-emerald-400 underline decoration-emerald-500/40 underline-offset-2 transition-colors hover:text-emerald-300 hover:decoration-emerald-400"
                >
                  Request this pilot →
                </Link>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <ScrollReveal delay={0.3}>
        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/30 p-8">
          <h3 className="text-lg font-semibold text-white">How Pilots Work</h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span><strong className="text-zinc-300">Scope-locked:</strong> Each pilot has a defined scope. No scope creep, no surprises.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span><strong className="text-zinc-300">Time-bound:</strong> Pilots have clear end dates. They convert to ongoing service or end cleanly.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span><strong className="text-zinc-300">Prepaid or deposit:</strong> Cash flow protection for both sides. No net-30 until we prove value.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span><strong className="text-zinc-300">Natural conversion:</strong> Successful pilots move to standard net-30 billing and ongoing contracts.</span>
            </li>
          </ul>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.4}>
        <div className="mt-8 text-center">
          <p className="text-zinc-500">
            Not sure which pilot fits?{" "}
            <Link href="/contact" className="font-medium text-white underline decoration-zinc-600 underline-offset-2 hover:decoration-white">
              Contact us
            </Link>{" "}
            and we'll recommend based on where your pain points are.
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
}
