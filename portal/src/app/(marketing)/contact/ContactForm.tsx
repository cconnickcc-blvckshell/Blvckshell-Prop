"use client";

import { useState, useEffect } from "react";
import MarketingButton from "@/components/marketing/MarketingButton";
import {
  ALLOWED_SERVICE_INTERESTS,
  parseServiceInterest,
  servicesCatalog,
  type ServiceInterestId,
} from "@/config/marketing-site";

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-[var(--brand-gold-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-gold-dark)]";

const PROPERTY_TYPES = [
  "Condominium",
  "Multi-residential rental",
  "Commercial office",
  "Mixed-use",
  "Post-construction / developer",
  "Other",
] as const;

function serviceLabel(id: ServiceInterestId): string {
  if (id === "general") return "General inquiry";
  if (id === "paid-pilot") return "Paid scoped pilot";
  if (id === "90-day-validation") return "90-Day Validation";
  const match = servicesCatalog.find((s) => s.id === id);
  return match?.title ?? id;
}

export default function ContactForm({
  initialService,
  initialIntent,
  defaultMessage,
}: {
  initialService?: string;
  initialIntent?: string;
  defaultMessage?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const serviceDefault = parseServiceInterest(initialService);

  const sourceParams = new URLSearchParams();
  if (initialIntent) sourceParams.set("intent", initialIntent);
  if (initialService) sourceParams.set("service", initialService);
  const sourcePage = sourceParams.toString() ? `/contact?${sourceParams}` : "/contact";

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

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          company: fd.get("company") || undefined,
          phone: fd.get("phone") || undefined,
          email: fd.get("email"),
          city: fd.get("city") || undefined,
          propertyType: fd.get("propertyType") || undefined,
          serviceInterest: fd.get("serviceInterest") || undefined,
          sitesCount: fd.get("sitesCount") || undefined,
          preferredContact: fd.get("preferredContact") || undefined,
          message: fd.get("message") || undefined,
          sourcePage: sourcePage.startsWith("/contact") ? sourcePage : "/contact",
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
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-busy={status === "sending"}>
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
          Name *
        </label>
        <input type="text" id="name" name="name" required className={inputClass} autoComplete="name" />
      </div>
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-zinc-300">
          Company / property
        </label>
        <input type="text" id="company" name="company" className={inputClass} autoComplete="organization" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
            Email *
          </label>
          <input type="email" id="email" name="email" required className={inputClass} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-zinc-300">
            Phone
          </label>
          <input type="tel" id="phone" name="phone" className={inputClass} autoComplete="tel" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-zinc-300">
            City
          </label>
          <input type="text" id="city" name="city" className={inputClass} placeholder="Windsor" />
        </div>
        <div>
          <label htmlFor="sitesCount" className="block text-sm font-medium text-zinc-300">
            Approx. properties / sites
          </label>
          <input type="number" id="sitesCount" name="sitesCount" min={0} className={inputClass} placeholder="1" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-zinc-300">
            Property category
          </label>
          <select id="propertyType" name="propertyType" className={inputClass} defaultValue="">
            <option value="">Select…</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="serviceInterest" className="block text-sm font-medium text-zinc-300">
            Service interest
          </label>
          <select
            id="serviceInterest"
            name="serviceInterest"
            className={inputClass}
            defaultValue={serviceDefault}
          >
            {ALLOWED_SERVICE_INTERESTS.map((id) => (
              <option key={id} value={id}>
                {serviceLabel(id)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="preferredContact" className="block text-sm font-medium text-zinc-300">
          Preferred contact method
        </label>
        <select id="preferredContact" name="preferredContact" className={inputClass} defaultValue="either">
          <option value="either">No preference</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-zinc-300">
          Project details
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={inputClass}
          placeholder="Scope, timing, access notes, or questions…"
        />
      </div>
      {status === "success" && (
        <p className="rounded-md border border-[var(--brand-gold-dark)]/40 bg-[var(--brand-gold)]/10 p-4 text-sm text-[var(--brand-gold-light)]" role="status">
          Thank you—we received your request. We will respond during business hours; site visits are scheduled after
          we confirm details, not automatically from this form.
        </p>
      )}
      {status === "error" && (
        <p className="rounded-md bg-red-900/40 p-4 text-sm text-red-300" role="alert">
          {errorMessage}
        </p>
      )}
      <MarketingButton type="submit" disabled={status === "sending"} className="w-full">
        {status === "sending" ? "Sending…" : "Send message"}
      </MarketingButton>
    </form>
  );
}
