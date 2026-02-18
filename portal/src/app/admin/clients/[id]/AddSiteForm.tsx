"use client";

import { useState } from "react";

type State = { error?: string; success?: boolean };

export default function AddSiteForm({ clientId }: { clientId: string }) {
  const [state, setState] = useState<State | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("clientOrganizationId", clientId);
    setIsSubmitting(true);
    setState(undefined);
    const { createSite } = await import("../actions");
    const result = await createSite(formData);
    setState(result);
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      {state?.error && (
        <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-md bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">Site added. Refresh to see it.</p>
      )}
      <input type="hidden" name="clientOrganizationId" value={clientId} />
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Site name *</label>
        <input id="name" name="name" type="text" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" placeholder="e.g. Lobby & Common Areas" />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-zinc-300">Address *</label>
        <input id="address" name="address" type="text" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" placeholder="Street, City, Province" />
      </div>
      <div>
        <label htmlFor="accessInstructions" className="block text-sm font-medium text-zinc-300">Access instructions</label>
        <textarea id="accessInstructions" name="accessInstructions" rows={2} className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" placeholder="Key at concierge, code for loading dock..." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="serviceWindow" className="block text-sm font-medium text-zinc-300">Service window</label>
          <input id="serviceWindow" name="serviceWindow" type="text" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" placeholder="e.g. 6:00–10:00" />
        </div>
        <div>
          <label htmlFor="estimatedDurationMinutes" className="block text-sm font-medium text-zinc-300">Est. duration (min)</label>
          <input id="estimatedDurationMinutes" name="estimatedDurationMinutes" type="number" min={1} className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" placeholder="45" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="requiredPhotoCount" className="block text-sm font-medium text-zinc-300">Required photos</label>
          <input id="requiredPhotoCount" name="requiredPhotoCount" type="number" min={1} defaultValue={4} className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </div>
        <div>
          <label htmlFor="suppliesProvidedBy" className="block text-sm font-medium text-zinc-300">Supplies</label>
          <select id="suppliesProvidedBy" name="suppliesProvidedBy" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white">
            <option value="COMPANY">Company</option>
            <option value="CLIENT">Client</option>
            <option value="MIXED">Mixed</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="doNotEnterUnits" name="doNotEnterUnits" type="checkbox" defaultChecked className="rounded border-zinc-600 bg-zinc-800" />
        <label htmlFor="doNotEnterUnits" className="text-sm text-zinc-300">Do not enter units</label>
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
        {isSubmitting ? "Adding…" : "Add site"}
      </button>
    </form>
  );
}
