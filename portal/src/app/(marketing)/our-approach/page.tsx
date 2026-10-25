import type { Metadata } from "next";
import MarketingButton from "@/components/marketing/MarketingButton";
import { blvckshellDifference, company, contactHref, serviceBeginsSteps } from "@/config/marketing-site";

export const metadata: Metadata = {
  title: "Our Approach",
  description:
    "How BLVCKSHELL defines scope, executes commercial cleaning consistently, and documents completion for Windsor–Essex property managers.",
};

export default function OurApproachPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Our Approach</h1>
      <p className="mt-4 text-lg text-zinc-400">{company.commercialLine}</p>
      <p className="mt-4 leading-relaxed text-zinc-300">
        {company.brandName} is an independently operated Canadian commercial cleaning and facilities execution
        company. Technology supports accountability—it is not the product we sell. What we sell is dependable
        cleaning, clearly defined scopes, and responsive communication.
      </p>

      <section className="mt-12">
        <h2 className="text-headline font-semibold text-white">How we work</h2>
        <ol className="mt-6 space-y-8">
          {serviceBeginsSteps.map((step) => (
            <li key={step.step} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--brand-gold-dark)] text-sm font-bold text-[var(--brand-gold)]">
                {step.step}
              </span>
              <div>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-headline font-semibold text-white">What you can expect</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {blvckshellDifference.map((item) => (
            <li key={item.title} className="rounded-xl border border-zinc-800 p-5">
              <h3 className="font-semibold text-[var(--brand-gold-light)]">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <MarketingButton href={contactHref({ intent: "evaluation" })}>Request a Site Evaluation</MarketingButton>
      </div>
    </div>
  );
}
