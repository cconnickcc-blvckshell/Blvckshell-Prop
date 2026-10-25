import type { Metadata } from "next";
import MarketingButton from "@/components/marketing/MarketingButton";
import { contactHref } from "@/config/marketing-site";
import { pvaClauses, pvaOfferMeta } from "@/config/pva-offer";

export const metadata: Metadata = {
  title: "90-Day Mutual Performance Validation",
  description:
    "Optional 90-day introductory arrangement to evaluate scope, schedule, and service fit. BLVCKSHELL Windsor–Essex commercial cleaning.",
};

export default function NinetyDayValidationPage() {
  return (
    <div className="bg-[var(--brand-black)]">
      <div className="border-b border-brand-gold-dark/40 bg-gradient-to-b from-[var(--brand-charcoal)] to-[var(--brand-black)] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-gold">
            Introductory offer — separate from paid scoped pilots
          </p>
          <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
            90-Day Mutual Performance Validation Period
          </h1>
          <p className="mt-4 text-lg text-zinc-400">{pvaClauses.optionalIntroductory}</p>
          {pvaOfferMeta.assetStatus === "missing_from_repo" ? (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
              Owner review required: source flyer <strong>{pvaOfferMeta.assetFile}</strong> ({pvaOfferMeta.assetDate})
              was not found in the repository for clause-by-clause legal sign-off.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">
        <section>
          <h2 className="text-xl font-semibold text-white">Mutual performance evaluation</h2>
          <p className="mt-3 text-zinc-300">{pvaClauses.mutualEvaluation}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Scope, schedule, and reviews</h2>
          <p className="mt-3 text-zinc-300">{pvaClauses.definedScopeScheduleReviews}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Adjustments</h2>
          <p className="mt-3 text-zinc-300">{pvaClauses.writtenChanges}</p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-[var(--brand-surface)]/40 p-6">
          <h2 className="text-lg font-semibold text-white">Commercial terms summary</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            <li>{pvaClauses.terminationNotice}</li>
            <li>{pvaClauses.noEarlyTerminationPenalty}</li>
            <li>{pvaClauses.paymentForServicesPerformed}</li>
            <li>{pvaClauses.notAutomaticRenewal}</li>
            <li className="text-zinc-500">{pvaClauses.marketingDisclaimer}</li>
          </ul>
        </section>

        <MarketingButton href={contactHref({ service: "90-day-validation", intent: "evaluation" })}>
          Request a Site Evaluation
        </MarketingButton>
      </div>
    </div>
  );
}
