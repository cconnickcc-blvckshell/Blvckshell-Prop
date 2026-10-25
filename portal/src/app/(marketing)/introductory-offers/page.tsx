import type { Metadata } from "next";
import Link from "next/link";
import MarketingButton from "@/components/marketing/MarketingButton";
import { contactHref } from "@/config/marketing-site";

export const metadata: Metadata = {
  title: "Introductory Offers",
  description:
    "Paid scoped pilots and the 90-Day Mutual Performance Validation Period for Windsor–Essex commercial cleaning.",
};

export default function IntroductoryOffersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <h1 className="text-4xl font-bold text-white sm:text-5xl">Introductory Offers</h1>
      <p className="mt-4 text-lg text-zinc-400">
        Two distinct ways to start a relationship—both require defined scope, authorization, and payment for work
        performed. Neither converts automatically to a recurring contract.
      </p>

      <section className="mt-12 rounded-xl border border-zinc-800 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-[var(--brand-gold-light)]">Option A — Paid Scoped Pilot</h2>
        <p className="mt-3 text-zinc-400">
          Suitable for one vacant unit, one building, one cleaning zone, or another agreed trial scope. The objective
          is to demonstrate capability before committing to a larger relationship.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-300">
          <li>• Scope documented in writing; customer authorization required.</li>
          <li>• Paid engagement with defined completion and acceptance requirements.</li>
          <li>• Clear payment terms.</li>
          <li>
            • Pilot-value credit toward the first recurring contract only if expressly agreed in writing—not an automatic
            discount.
          </li>
          <li>• No automatic conversion to ongoing service.</li>
        </ul>
        <MarketingButton
          href={contactHref({ service: "paid-pilot", intent: "quote" })}
          className="mt-6"
        >
          Discuss a Paid Pilot
        </MarketingButton>
      </section>

      <section className="mt-10 rounded-xl border border-[var(--brand-gold-dark)]/50 bg-[var(--brand-charcoal)]/50 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-[var(--brand-gold-light)]">
          Option B — 90-Day Mutual Performance Validation
        </h2>
        <p className="mt-3 text-zinc-400">
          Optional ninety-day evaluation of performance, communication, scope accuracy, and operating fit.
        </p>
        <Link href="/90-day-validation" className="mt-4 inline-block text-sm font-medium text-[var(--brand-gold)] hover:underline">
          Read full program details →
        </Link>
      </section>
    </div>
  );
}
