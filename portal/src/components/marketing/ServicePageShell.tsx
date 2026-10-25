import Image from "next/image";
import Link from "next/link";
import MarketingButton from "@/components/marketing/MarketingButton";
import { contactHref, type ServiceInterestId } from "@/config/marketing-site";

export type ServicePageSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};

type ServicePageShellProps = {
  title: string;
  subtitle: string;
  heroImage?: string;
  heroImageAlt: string;
  problem: string;
  sections: ServicePageSection[];
  exclusions?: string[];
  completionNote: string;
  serviceInterest: ServiceInterestId;
  offerLink?: { href: string; label: string };
};

export default function ServicePageShell({
  title,
  subtitle,
  heroImage,
  heroImageAlt,
  problem,
  sections,
  exclusions,
  completionNote,
  serviceInterest,
  offerLink,
}: ServicePageShellProps) {
  return (
    <div className="min-h-screen">
      <div className="relative h-[42vh] min-h-[280px] overflow-hidden bg-[var(--brand-charcoal)]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={heroImageAlt}
            fill
            className="object-cover opacity-50"
            priority
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-black)] via-[var(--brand-black)]/70 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-4xl items-end px-4 pb-10 sm:px-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-lg text-[var(--brand-muted)]">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-lg leading-relaxed text-zinc-300">{problem}</p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-headline font-semibold text-white">{section.heading}</h2>
              {section.body ? <p className="mt-3 text-zinc-400">{section.body}</p> : null}
              {section.bullets?.length ? (
                <ul className="mt-4 space-y-2 text-zinc-300">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[var(--brand-gold)]" aria-hidden>
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {exclusions?.length ? (
          <section className="mt-12 rounded-xl border border-zinc-800 bg-[var(--brand-surface)]/40 p-6">
            <h2 className="text-lg font-semibold text-white">Major exclusions</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {exclusions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Completion & communication</h2>
          <p className="mt-3 text-zinc-400">{completionNote}</p>
        </section>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <MarketingButton href={contactHref({ service: serviceInterest, intent: "evaluation" })}>
            Request a Site Evaluation
          </MarketingButton>
          {offerLink ? (
            <Link
              href={offerLink.href}
              className="text-sm font-medium text-[var(--brand-gold)] underline-offset-4 hover:underline"
            >
              {offerLink.label}
            </Link>
          ) : null}
          <Link href="/services" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← All services
          </Link>
        </div>
      </div>
    </div>
  );
}
