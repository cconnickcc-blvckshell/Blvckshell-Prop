"use client";

import { useState, useEffect } from "react";

export default function ContactForm({
  requestType,
  defaultMessage,
}: {
  requestType?: string;
  defaultMessage?: string;
} = {}) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const sourcePage = requestType ? `/contact?request=${encodeURIComponent(requestType)}` : "/contact";

  useEffect(() => {
    if (defaultMessage && typeof document !== "undefined") {
      const el = document.getElementById("message") as HTMLTextAreaElement | null;
      if (el && !el.value) el.value = defaultMessage;
    }
  }, [defaultMessage]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

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
        phone: fd.get("phone"),
        email: fd.get("email"),
        buildingAddress: fd.get("buildingAddress"),
        propertyType: fd.get("propertyType"),
        frequency: fd.get("frequency"),
        callbackTime: fd.get("callbackTime"),
        message: fd.get("message"),
        preferredContact: fd.get("preferredContact") || undefined,
        sourcePage,
        website: fd.get("website") ?? "",
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
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Name *</label>
        <input type="text" id="name" name="name" required className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">Email *</label>
        <input type="email" id="email" name="email" required className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" placeholder="you@company.com" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">Phone</label>
        <input type="tel" id="phone" name="phone" className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" placeholder="Your phone (optional)" />
      </div>
      <div>
        <label htmlFor="buildingAddress" className="block text-sm font-medium text-zinc-300">Building address</label>
        <input type="text" id="buildingAddress" name="buildingAddress" className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" placeholder="Street address, city" />
      </div>
      <div>
        <label htmlFor="propertyType" className="block text-sm font-medium text-zinc-300">Building type</label>
        <select id="propertyType" name="propertyType" className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500">
          <option value="">Select</option>
          <option value="condo">Condo</option>
          <option value="commercial">Office / Commercial</option>
          <option value="mixed">Mixed</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="frequency" className="block text-sm font-medium text-zinc-300">Frequency</label>
        <select id="frequency" name="frequency" className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500">
          <option value="">Select</option>
          <option value="daily">Daily</option>
          <option value="3x-week">3x per week</option>
          <option value="2x-week">2x per week</option>
          <option value="weekly">Weekly</option>
          <option value="other">Other / Not sure</option>
        </select>
      </div>
      <div>
        <label htmlFor="callbackTime" className="block text-sm font-medium text-zinc-300">Best callback time</label>
        <select id="callbackTime" name="callbackTime" className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500">
          <option value="">Select</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="either">Either</option>
        </select>
      </div>
      <div>
        <label htmlFor="preferredContact" className="block text-sm font-medium text-zinc-300">Preferred contact method</label>
        <select id="preferredContact" name="preferredContact" className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500">
          <option value="either">Email or phone—your choice</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-zinc-300">Message (optional)</label>
        <textarea id="message" name="message" rows={3} className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" placeholder="Any questions or details about your needs?" />
      </div>
      {status === "success" && <p className="rounded-md bg-green-900/40 p-4 text-sm text-green-300">Thanks. We’ve received your message and will respond within one business day.</p>}
      {status === "error" && <p className="rounded-md bg-red-900/40 p-4 text-sm text-red-300">{errorMessage}</p>}
      <button type="submit" disabled={status === "sending"} className="w-full rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50">
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
