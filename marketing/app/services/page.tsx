import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description: "BLVCKSHELL facilities services: condo cleaning, commercial cleaning, light maintenance.",
};

const SERVICES = [
  {
    href: "/condo-cleaning",
    title: "Condo cleaning",
    summary: "Common areas, lobbies, washrooms, and shared spaces. Site-specific checklists and evidence.",
  },
  {
    href: "/commercial-cleaning",
    title: "Commercial cleaning",
    summary: "Office, retail, and mixed-use. Scheduled and on-demand cleaning with consistent quality.",
  },
  {
    href: "/light-maintenance",
    title: "Light maintenance",
    summary: "Minor repairs, bulb replacement, and site support. Logged and tracked in our portal.",
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Services</h1>
      <p className="mt-4 text-zinc-400">
        We deliver cleaning and light maintenance with clear scope, checklists,
        and evidence so you can review and approve with confidence.
      </p>
      <ul className="mt-12 space-y-8">
        {SERVICES.map(({ href, title, summary }) => (
          <li key={href}>
            <Link
              href={href}
              className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-600"
            >
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <p className="mt-2 text-zinc-400">{summary}</p>
              <span className="mt-4 inline-block text-sm font-medium text-white underline">
                Learn more →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-12 text-zinc-500">
        Need a custom scope or multi-site program?{" "}
        <Link href="/contact" className="text-white underline hover:no-underline">
          Contact us
        </Link>{" "}
        for a quote.
      </p>
    </div>
  );
}
