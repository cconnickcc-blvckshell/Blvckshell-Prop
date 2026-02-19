import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request a quote or get in touch with BLVCKSHELL facilities services. Windsor–Essex and Ontario-wide.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const params = await searchParams;
  const isSampleRequest = params.request === "sample-report";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-white">Contact</h1>
      <p className="mt-4 text-zinc-400">
        Request a quote, book a site walk, or ask a question. We’ll respond within one business day.
      </p>
      {isSampleRequest && (
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-300">
            <strong>Sample report request.</strong> Share your details below and we'll send you an anonymized example of a completion report.
          </p>
        </div>
      )}

      {/* Direct contact — mobile-first */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Reach us directly</h2>
        <ul className="mt-4 space-y-3">
          <li>
            <a href="mailto:hello@blvckshell.com" className="text-white underline decoration-zinc-600 underline-offset-2 hover:decoration-white">
              hello@blvckshell.com
            </a>
          </li>
          <li>
            <span className="text-zinc-300">Phone available when we connect</span>
            <span className="ml-2 text-zinc-500">— share your number in the form and we’ll call you.</span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-500">
          Prefer to book a site walk? Say so in your message and we’ll send a link or coordinate a time.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-white">Send a message</h2>
      <ContactForm
        requestType={params.request}
        defaultMessage={isSampleRequest ? "I'd like to receive a sample completion report." : undefined}
      />

      <div className="mt-10 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-4 py-4">
        <p className="text-sm font-medium text-zinc-300">What happens next</p>
        <p className="mt-1 text-sm text-zinc-500">
          We’ll reply within one business day. If you asked for a quote, we’ll confirm your details and schedule a site walk or send a proposal. You can reply by email or phone—whichever you prefer.
        </p>
      </div>
    </div>
  );
}
