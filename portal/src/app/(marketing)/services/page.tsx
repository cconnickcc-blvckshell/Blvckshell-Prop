import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { contactHref, servicesCatalog } from "@/config/marketing-site";

export const metadata: Metadata = {
  title: "Commercial Cleaning Services",
  description:
    "Condominium common-area, office, rental turnover, deep cleaning, post-construction final cleaning, and conditional facilities support in Windsor–Essex.",
};

export default function ServicesPage() {
  const primary = servicesCatalog.filter((s) => s.primary);
  const secondary = servicesCatalog.filter((s) => !s.primary);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <h1 className="text-4xl font-bold text-white sm:text-5xl">Services</h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-400">
        Core commercial cleaning programs with defined scope. Evaluation and written agreement precede scheduled service.
      </p>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-gold)]">Primary services</h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {primary.map((service) => (
            <li key={service.id}>
              <Link
                href={service.href}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 transition hover:border-[var(--brand-gold-dark)]"
              >
                {service.image ? (
                  <div className="relative h-44 bg-zinc-900">
                    <Image src={service.image} alt="" fill className="object-cover opacity-75" sizes="50vw" />
                  </div>
                ) : null}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{service.shortDescription}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {secondary.length ? (
        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Secondary / conditional</h2>
          <ul className="mt-6 space-y-4">
            {secondary.map((service) => (
              <li key={service.id}>
                <Link href={service.href} className="text-lg font-medium text-zinc-300 hover:text-[var(--brand-gold-light)]">
                  {service.title} →
                </Link>
                <p className="text-sm text-zinc-500">{service.shortDescription}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 text-sm text-zinc-500">
        <Link href={contactHref({ intent: "evaluation" })} className="text-[var(--brand-gold)] hover:underline">
          Request a site evaluation
        </Link>{" "}
        to confirm scope and suitability.
      </p>
    </div>
  );
}
