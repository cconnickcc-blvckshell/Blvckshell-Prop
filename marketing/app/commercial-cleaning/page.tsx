import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Commercial cleaning",
  description: "Office, retail, and commercial building cleaning. Scheduled and on-demand with consistent quality.",
};

export default function CommercialCleaningPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Commercial cleaning</h1>
      <p className="mt-4 text-zinc-400">
        We provide cleaning for office, retail, and mixed-use commercial
        properties. Services are scheduled to your requirements and backed by
        checklists and evidence.
      </p>
      <div className="mt-10 space-y-6 text-zinc-300">
        <p>
          Scope can include general office cleaning, washrooms, kitchens,
          common areas, and floor care. We work with property managers to define
          frequency and scope per site. All completions are logged in our portal
          with photos and checklist results.
        </p>
        <p>
          Multi-site portfolios are supported: one point of contact, consistent
          quality, and full visibility into completed work and approvals.
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
