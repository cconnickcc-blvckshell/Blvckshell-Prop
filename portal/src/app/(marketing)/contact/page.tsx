import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Request a quote or get in touch with BLVCKSHELL facilities services.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Contact</h1>
      <p className="mt-4 text-zinc-400">
        Request a quote, book a site walk, or ask a question. We’ll respond within one business day.
      </p>
      <ContactForm />
    </div>
  );
}
