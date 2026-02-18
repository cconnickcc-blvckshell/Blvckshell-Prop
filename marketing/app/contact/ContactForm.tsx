"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Honeypot: if filled, treat as bot and still return success
    const honeypot = (fd.get("website") as string)?.trim();
    if (honeypot) {
      setStatus("success");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        company: fd.get("company"),
        role: fd.get("role"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        propertyType: fd.get("propertyType"),
        sitesCount: fd.get("sitesCount") ? Number(fd.get("sitesCount")) : undefined,
        message: fd.get("message"),
        sourcePage: "/contact",
        website: fd.get("website") ?? "", // honeypot
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setStatus("success");
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-zinc-300">
          Company
        </label>
        <input
          type="text"
          id="company"
          name="company"
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="Company or property management"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-zinc-300">
          Role
        </label>
        <input
          type="text"
          id="role"
          name="role"
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="e.g. Property Manager"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="(555) 000-0000"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="propertyType" className="block text-sm font-medium text-zinc-300">
          Property type
        </label>
        <select
          id="propertyType"
          name="propertyType"
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        >
          <option value="">Select</option>
          <option value="condo">Condo</option>
          <option value="commercial">Commercial</option>
          <option value="mixed">Mixed</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="sitesCount" className="block text-sm font-medium text-zinc-300">
          Number of sites
        </label>
        <input
          type="number"
          id="sitesCount"
          name="sitesCount"
          min={0}
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="e.g. 5"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-zinc-300">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="Tell us about your needs, timeline, or questions."
        />
      </div>

      {status === "success" && (
        <p className="rounded-md bg-green-900/40 p-4 text-sm text-green-300">
          Thanks. We’ve received your message and will respond within one business day.
        </p>
      )}
      {status === "error" && (
        <p className="rounded-md bg-red-900/40 p-4 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
