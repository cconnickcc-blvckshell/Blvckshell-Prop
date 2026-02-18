import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About BLVCKSHELL facilities services. Who we are and how we work with property managers.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">About BLVCKSHELL</h1>
      <p className="mt-4 text-zinc-400">
        We provide facilities services for condos and commercial properties,
        with a focus on consistency, evidence, and ease of review for property
        managers.
      </p>
      <div className="mt-10 space-y-6 text-zinc-300">
        <p>
          BLVCKSHELL was built to solve a common problem: property managers need
          reliable cleaning and light maintenance across multiple sites, with
          clear scope and proof of work. We use site-specific checklists and
          completion evidence so you can see what was done and approve with
          confidence.
        </p>
        <p>
          Our network includes internal crews and vetted subcontractors. All are
          onboarded with compliance documentation (COI, WSIB) and trained on
          your scope. Work is assigned, completed, and approved through our
          portal—one place for scheduling, evidence, and payouts.
        </p>
        <p>
          We serve the Greater Toronto Area and work with property managers,
          condo boards, and commercial building operators. For custom scope or
          multi-site programs, get in touch.
        </p>
      </div>
      <Link
        href="/contact"
        className="mt-10 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
      >
        Contact us
      </Link>
    </div>
  );
}
