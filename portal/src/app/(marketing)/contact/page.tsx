import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request a quote or get in touch with BLVCKSHELL facilities services. Windsor-Essex and Ontario-wide coverage as we expand.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const params = await searchParams;
  const isSampleRequest = params.request === "sample-report";
  const isQuoteRequest = params.request === "quote";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Contact</h1>
      <p className="mt-4 text-lg text-zinc-400">
        Request a quote, book a portfolio walkthrough, or ask a question. We&apos;ll respond within one business day.
      </p>

      {isSampleRequest && (
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-300">
            <strong>Sample report request.</strong> Share your details below and we&apos;ll send you an anonymized example of a completion report.
          </p>
        </div>
      )}
      {isQuoteRequest && (
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-300">
            <strong>Request a quote.</strong> Tell us about your sites and we&apos;ll send a ballpark range and next steps.
          </p>
        </div>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        {/* Left: Contact Info */}
        <div className="space-y-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Reach Us Directly</h2>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:hello@blvckshell.com" className="text-white underline decoration-zinc-600 underline-offset-2 hover:decoration-white">
                  hello@blvckshell.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+12269462558" className="text-white underline decoration-zinc-600 underline-offset-2 hover:decoration-white">
                  (226) 946-BLVK
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-zinc-300">Windsor-Essex, Ontario</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Business Hours</h2>
            <p className="mt-4 text-zinc-300">Mon&ndash;Fri, 7 AM &ndash; 5 PM EST</p>
            <p className="mt-2 text-sm text-zinc-500">
              Prefer to book a site walk? Say so in your message and we&apos;ll coordinate a time.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-4 py-4">
            <p className="text-sm font-medium text-zinc-300">What happens next</p>
            <p className="mt-1 text-sm text-zinc-500">
              We&apos;ll reply within one business day. If you asked for a quote, we&apos;ll confirm your details and schedule a site walk or send a proposal.
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          <h2 className="text-xl font-semibold text-white">Send a Message</h2>
          <ContactForm
            requestType={params.request}
            defaultMessage={
              isSampleRequest
                ? "I'd like to receive a sample completion report."
                : isQuoteRequest
                  ? "I'd like a quote for facilities services. Please include ballpark pricing and next steps."
                  : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
