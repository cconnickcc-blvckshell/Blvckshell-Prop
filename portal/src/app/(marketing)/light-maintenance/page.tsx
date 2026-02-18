import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Light maintenance",
  description: "Minor repairs, bulb replacement, and site support in Windsor–Essex and Ontario. Logged and tracked in the portal.",
};

export default function LightMaintenancePage() {
  return (
    <div className="min-h-screen">
      <section className="relative border-b border-zinc-800">
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/90">
          <div className="text-center text-zinc-500">
            <svg className="mx-auto h-20 w-20 text-zinc-600 sm:h-24 sm:w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-sm font-medium">Light maintenance — photo placeholder</p>
          </div>
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Light maintenance</h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300">
            Minor repairs, bulb replacement, and site support. Logged and tracked in our portal so you see what was done and when.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-xl font-semibold text-white">What’s included</h2>
        <ul className="mt-4 space-y-2 text-zinc-300">
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Bulb replacement (common areas, within reach)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Minor repairs (door hardware, cabinet fixes, small touch-ups)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Filter checks and basic HVAC visual checks where agreed</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Site support (access issues, lockouts, coordination with cleaning)</li>
          <li className="flex gap-2"><span className="text-emerald-500">•</span> Work logged in the portal with notes and follow-up when needed</li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-white">What’s excluded</h2>
        <p className="mt-2 text-zinc-400">
          Licensed trades (electrical, plumbing, HVAC repair), major repairs, and work inside units unless in scope. We escalate to your preferred vendors when needed.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-white">Frequency & add-ons</h2>
        <p className="mt-2 text-zinc-400">
          Can be bundled with cleaning (e.g. “cleaning + bulb check”) or scheduled as stand-alone visits. One-off work orders for specific tasks—quoted per job.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-white">How quoting works</h2>
        <p className="mt-2 text-zinc-400">
          We align on scope (what counts as light maintenance at your site), frequency, and any caps. Then we quote and log all work in the portal for your review.
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
