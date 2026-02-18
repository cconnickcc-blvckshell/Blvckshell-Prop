import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Condo cleaning",
  description: "Common area and lobby cleaning for condos in Windsor–Essex and Ontario. Site-specific checklists and photo evidence.",
};

export default function CondoCleaningPage() {
  return (
    <div className="min-h-screen">
      {/* Hero + placeholder */}
      <section className="relative border-b border-zinc-800">
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90">
          <div className="text-center text-zinc-500">
            <svg className="mx-auto h-20 w-20 text-zinc-600 sm:h-24 sm:w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-2 text-sm font-medium">Condo common areas — photo placeholder</p>
          </div>
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Condo cleaning</h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300">
            Common areas, lobbies, washrooms, and shared spaces. Site-specific checklists and evidence so you know exactly what’s done and when.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-xl font-semibold text-white">What’s included</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Lobby and entrance (floor, glass, desk, bins)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Hallways and stairwells (sweep, mop, baseboards)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Elevators (floor, panel, walls)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Common washrooms (toilets, sinks, mirrors, sanitize)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Garbage rooms (floor, bins, deodorize)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Site-specific checklist per job; photo evidence in the portal</li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-white">What’s excluded</h2>
        <p className="mt-2 text-zinc-400">
          We do not enter resident units. Deep carpet cleaning, hazmat, and window exteriors are add-ons or separate scope. We’ll confirm exclusions at site walk.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-white">Frequency</h2>
        <p className="mt-2 text-zinc-400">
          Set per contract: e.g. 2x, 3x, or 5x per week. Service window and days agreed at quote. Flat monthly fee—no hourly billing.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-white">Add-ons</h2>
        <p className="mt-2 text-zinc-400">
          Seasonal deep clean, extra hallway passes, glass door spot cleans, and one-off work orders. Priced per site or per visit—ask in your quote request.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-white">How quoting works</h2>
        <p className="mt-2 text-zinc-400">
          We align on scope (areas, checklist, frequency), do a site walk if helpful, then send a clear quote and schedule. Once approved, work starts and you review completions in the portal.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link href="/contact" className="inline-flex justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200">
            Request a quote
          </Link>
          <Link href="/services" className="inline-flex justify-center rounded-lg border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-500">
            ← Back to services
          </Link>
        </div>
      </div>
    </div>
  );
}
