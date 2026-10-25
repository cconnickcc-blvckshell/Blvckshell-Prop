import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import PhoneContact from "@/components/marketing/PhoneContact";
import { company, parseServiceInterest } from "@/config/marketing-site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Request a quote or site evaluation for commercial cleaning in Windsor–Essex. BLVCKSHELL Incorporated.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string; intent?: string; service?: string }>;
}) {
  const params = await searchParams;
  const service = parseServiceInterest(params.service);
  const intent = params.intent ?? params.request;

  let defaultMessage: string | undefined;
  if (params.request === "sample-report") {
    defaultMessage = "I'd like to receive a sample completion report (anonymized example).";
  } else if (intent === "quote" || params.request === "quote") {
    defaultMessage = "I'd like a quote based on defined scope after evaluation.";
  } else if (intent === "evaluation") {
    defaultMessage = "I'd like to request a site evaluation.";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Contact</h1>
      <p className="mt-4 text-lg text-zinc-400">
        Request a quote or site evaluation. Submitting this form does not automatically schedule a visit—we confirm
        details and agree on next steps first.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Reach us directly</h2>
            <ul className="mt-5 space-y-4 text-zinc-300">
              <li>
                <a
                  href={`mailto:${company.email}`}
                  className="text-[var(--brand-gold-light)] underline-offset-2 hover:underline"
                >
                  {company.email}
                </a>
              </li>
              <li>
                <PhoneContact linkClassName="text-[var(--brand-gold-light)] underline-offset-2 hover:underline" />
              </li>
              <li>{company.primaryRegion}, Ontario</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Business hours</h2>
            <p className="mt-4 text-zinc-300">Mon–Fri, 7 AM – 5 PM EST</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">Send a message</h2>
          <ContactForm
            initialService={service !== "general" ? service : undefined}
            initialIntent={intent}
            defaultMessage={defaultMessage}
          />
        </div>
      </div>
    </div>
  );
}
