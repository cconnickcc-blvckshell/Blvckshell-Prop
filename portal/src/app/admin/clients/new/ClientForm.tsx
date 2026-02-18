"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type State = { error?: string; success?: boolean };

export default function ClientForm({ action }: { action: (formData: FormData) => Promise<{ error?: string; success?: boolean }> }) {
  const router = useRouter();
  const [state, setState] = useState<State | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);
    setState(undefined);
    const result = await action(formData);
    setState(result);
    setIsSubmitting(false);
    if (result.success) router.push("/admin/clients");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      {state?.error && (
        <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
          Organization name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="e.g. Maple Condos Inc."
        />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="primaryContactName" className="block text-sm font-medium text-zinc-300">
            Primary contact name *
          </label>
          <input
            id="primaryContactName"
            name="primaryContactName"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="primaryContactEmail" className="block text-sm font-medium text-zinc-300">
            Primary contact email *
          </label>
          <input
            id="primaryContactEmail"
            name="primaryContactEmail"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
      <div>
        <label htmlFor="primaryContactPhone" className="block text-sm font-medium text-zinc-300">
          Primary contact phone *
        </label>
        <input
          id="primaryContactPhone"
          name="primaryContactPhone"
          type="tel"
          required
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="+1 416 555 0000"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-zinc-300">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Optional notes"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create client"}
        </button>
        <Link
          href="/admin/clients"
          className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
