import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request a quote or get in touch with BLVCKSHELL facilities services. Windsor–Essex and Ontario-wide.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-white">Contact</h1>
      <p className="mt-4 text-zinc-400">
        Request a quote, book a site walk, or ask a question. We’ll respond within one business day.
      </p>

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
            <a href="tel:+15195550100" className="text-white underline decoration-zinc-600 underline-offset-2 hover:decoration-white">
              (519) 555-0100
            </a>
            <span className="ml-2 text-zinc-500">Windsor–Essex</span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-500">
          Prefer to book a site walk? Say so in your message and we’ll send a link or coordinate a time.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-white">Send a message</h2>
      <ContactForm />

      <div className="mt-10 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-4 py-4">
        <p className="text-sm font-medium text-zinc-300">What happens next</p>
        <p className="mt-1 text-sm text-zinc-500">
          We’ll reply within one business day. If you asked for a quote, we’ll confirm your details and schedule a site walk or send a proposal. You can reply by email or phone—whichever you prefer.
        </p>
      </div>
    </div>
  );
}
