import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Light maintenance",
  description: "Minor repairs, bulb replacement, and site support. Logged and tracked in the BLVCKSHELL portal.",
};

export default function LightMaintenancePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Light maintenance</h1>
      <p className="mt-4 text-zinc-400">We handle minor repairs, bulb replacement, and general site support for condos and commercial buildings. Work is logged and tracked so you have a clear record of what was done and when.</p>
      <div className="mt-10 space-y-6 text-zinc-300">
        <p>Typical light maintenance includes bulb changes, minor fixture repairs, door adjustments, and small handyman tasks. Scope is defined per site or work order. Completions are recorded in our portal with notes and evidence as needed.</p>
        <p>For larger or specialized work we can coordinate with your preferred vendors or recommend vetted contractors. Our focus is consistent execution and visibility for property managers.</p>
      </div>
      <Link href="/contact" className="mt-10 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200">Request a quote</Link>
      <p className="mt-8"><Link href="/services" className="text-zinc-400 hover:text-white">← Back to services</Link></p>
    </div>
  );
}
