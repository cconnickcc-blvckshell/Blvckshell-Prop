import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Condo cleaning",
  description: "Common area and lobby cleaning for condos. Site-specific checklists and evidence for property managers.",
};

export default function CondoCleaningPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Condo cleaning</h1>
      <p className="mt-4 text-zinc-400">
        We clean common areas, lobbies, washrooms, and shared spaces in condo
        buildings. Each site has a defined scope and checklist so you know
        exactly what’s done and when.
      </p>
      <div className="mt-10 space-y-6 text-zinc-300">
        <p>
          Services include lobby and entrance cleaning, washroom and common-area
          sanitization, floor care, and trash removal. Frequency is set per
          contract (e.g. daily, weekly). Completion evidence and photos are
          captured in our portal for your review.
        </p>
        <p>
          All work is performed by assigned crews with compliance (COI, WSIB) on
          file. Property managers and boards can review completions and approve
          for payment in one place.
        </p>
      </div>
      <Link
        href="/contact"
        className="mt-10 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
      >
        Request a quote
      </Link>
      <p className="mt-8">
        <Link href="/services" className="text-zinc-400 hover:text-white">
          ← Back to services
        </Link>
      </p>
    </div>
  );
}
