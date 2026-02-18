import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Commercial cleaning",
  description: "Office, retail, and mixed-use cleaning in Windsor–Essex and Ontario. Scheduled and on-demand with consistent quality.",
};

export default function CommercialCleaningPage() {
  return (
    <div className="min-h-screen">
      <section className="relative border-b border-zinc-800">
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90">
          <div className="text-center text-zinc-500">
            <svg className="mx-auto h-20 w-20 text-zinc-600 sm:h-24 sm:w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-2 text-sm font-medium">Commercial space — photo placeholder</p>
          </div>
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Commercial cleaning</h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300">
            Office, retail, and mixed-use. Scheduled and on-demand cleaning with consistent quality and evidence in the portal.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-xl font-semibold text-white">What’s included</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Lobbies, corridors, and common areas</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Washrooms and break rooms</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Floor care (sweep, mop, vacuum per surface)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> High-touch surfaces and sanitization</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Trash and recycling removal</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Scope and checklist per site; completion evidence in the portal</li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-white">What’s excluded</h2>
        <p className="mt-2 text-zinc-400">
          Tenant-only areas unless in scope. Hazmat, specialized equipment (e.g. floor stripping), and after-hours only by agreement. We’ll confirm at walkthrough.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-white">Frequency</h2>
        <p className="mt-2 text-zinc-400">
          Daily, several times per week, or weekly—tailored to your building and contract. Service window and days agreed at quote. Flat fee or per-visit pricing.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-white">Add-ons</h2>
        <p className="mt-2 text-zinc-400">
          Deep cleans, carpet cleaning, window interiors, and one-off work orders. Priced per site or per visit—outline your needs in the contact form.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-white">How quoting works</h2>
        <p className="mt-2 text-zinc-400">
          We review your areas and frequency, do a site walk if needed, then send a clear quote. After approval, crews run on schedule and you review completions in the portal.
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
