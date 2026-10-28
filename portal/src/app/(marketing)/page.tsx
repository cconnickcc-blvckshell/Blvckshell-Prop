import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MarketingButton from "@/components/marketing/MarketingButton";
import {
  blvckshellDifference,
  company,
  contactHref,
  serviceArea,
  serviceBeginsSteps,
  servicesCatalog,
  whoWeServe,
} from "@/config/marketing-site";

export const metadata: Metadata = {
  title: "Commercial Cleaning Windsor–Essex | BLVCKSHELL",
  description:
    "Professional common-area, office, rental turnover, and building reset cleaning across Windsor–Essex. Clear scopes, consistent service, documented completion.",
};

const primaryServices = servicesCatalog.filter((s) => s.primary);

export default function HomePage() {
  return (
    <div className="bg-[var(--brand-black)]">
      <section className="relative min-h-[85vh] w-full overflow-hidden">
        <Image
          src="/marketing/commercial-interior.jpg"
          alt="Clean commercial interior — illustrative stock photography"
          fill
          priority
          className="object-cover opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-[var(--brand-black)]" />
        <div className="relative mx-auto flex min-h-[85vh] max-w-6xl flex-col items-center justify-center px-4 pb-36 pt-20 text-center sm:px-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            {company.supportingLine}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
            Commercial Cleaning. Accountable by Design.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--brand-muted)]">
            Professional common-area cleaning, office cleaning, rental turnovers, and building resets
            across {company.primaryRegion}. Clear scopes, consistent service, and documented completion.
          </p>
          <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <MarketingButton href={contactHref({ intent: "evaluation" })}>
              Request a Site Evaluation
            </MarketingButton>
            <MarketingButton href="/services" variant="secondary">
              Explore Our Services
            </MarketingButton>
          </div>
          <p className="mt-8 text-sm text-zinc-500">{company.commercialLine}</p>
        </div>
      </section>

      <section className="border-y border-zinc-800/80 bg-[var(--brand-charcoal)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-headline font-semibold text-white">Who We Serve</h2>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Practical cleaning execution for decision-makers who need scope clarity—not vague promises.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whoWeServe.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-zinc-800 bg-[var(--brand-surface)]/30 p-6"
              >
                <h3 className="font-semibold text-[var(--brand-gold-light)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-headline font-semibold text-white">Core Services</h2>
          <p className="mt-3 text-zinc-400">
            Five primary cleaning programs—each with defined scope, exclusions, and evaluation before service.
          </p>
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {primaryServices.map((service) => (
              <li key={service.id}>
                <Link
                  href={service.href}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition hover:border-[var(--brand-gold-dark)]"
                >
                  {service.image ? (
                    <div className="relative h-40 w-full bg-zinc-900">
                      <Image
                        src={service.image}
                        alt=""
                        fill
                        className="object-cover opacity-70 transition group-hover:opacity-90"
                        sizes="(max-width:768px) 100vw, 33vw"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-white group-hover:text-[var(--brand-gold-light)]">
                      {service.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-zinc-400">{service.shortDescription}</p>
                    <span className="mt-4 text-sm font-medium text-[var(--brand-gold)]">Learn more →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-[var(--brand-charcoal)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-headline font-semibold text-white">The BLVCKSHELL Difference</h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {blvckshellDifference.map((item) => (
              <li key={item.title} className="border-l-2 border-[var(--brand-gold)] pl-4">
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link href="/our-approach" className="text-sm font-medium text-[var(--brand-gold)] hover:underline">
              Read our approach →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-headline font-semibold text-white">How Service Begins</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {serviceBeginsSteps.map((step) => (
              <li key={step.step}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand-gold-dark)] text-sm font-bold text-[var(--brand-gold)]">
                  {step.step}
                </span>
                <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-gradient-to-r from-[var(--brand-charcoal)] to-[var(--brand-black)] py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">90-Day Mutual Performance Validation</h2>
            <p className="mt-4 text-zinc-400">
              An optional introductory arrangement with agreed scope, schedule, and periodic mutual review—so both
              parties evaluate fit before a long-term commitment. Not free cleaning; services performed remain payable.
            </p>
          </div>
          <MarketingButton href="/90-day-validation" className="mt-8 shrink-0 lg:mt-0">
            View the Program
          </MarketingButton>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-headline font-semibold text-white">{serviceArea.headline}</h2>
          <p className="mt-4 text-zinc-400">
            Based in {company.headquarters}, serving{" "}
            {serviceArea.primaryCommunities.join(", ")}, and surrounding communities in{" "}
            {company.primaryRegion}.
          </p>
          <p className="mt-3 text-sm text-zinc-500">{serviceArea.secondaryNote}</p>
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-[var(--brand-charcoal)] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready for a Higher Standard of Commercial Cleaning?
          </h2>
          <p className="mt-4 text-zinc-400">
            Request a no-obligation site evaluation. We&apos;ll confirm scope and next steps—visits are scheduled after
            mutual agreement, not automatically from a form submission.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingButton href={contactHref({ intent: "evaluation" })}>
              Request a Site Evaluation
            </MarketingButton>
            <MarketingButton href={contactHref({ intent: "quote" })} variant="secondary">
              Request a Quote
            </MarketingButton>
          </div>
        </div>
      </section>
    </div>
  );
}
