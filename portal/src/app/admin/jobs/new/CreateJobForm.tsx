"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Site = { id: string; name: string; address: string; clientOrganization: { name: string } };
type Worker = {
  id: string;
  user: { name: string; email: string };
  workforceAccount: { displayName: string; type: string };
};

type State = { error?: string; success?: boolean };

export default function CreateJobForm({
  action,
  sites,
  workers,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  sites: Site[];
  workers: Worker[];
}) {
  const router = useRouter();
  const [state, setState] = useState<State | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);
    setState(undefined);
    const result = await action(formData);
    setState(result);
    setIsSubmitting(false);
    if (result.success) router.push("/admin/jobs");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      {state?.error && (
        <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}
      <div>
        <label htmlFor="siteId" className="block text-sm font-medium text-zinc-300">Site *</label>
        <select id="siteId" name="siteId" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white">
          <option value="">Select site</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.clientOrganization.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="assignedWorkerId" className="block text-sm font-medium text-zinc-300">Assigned worker *</label>
        <select id="assignedWorkerId" name="assignedWorkerId" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white">
          <option value="">Select worker</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.user.name} ({w.workforceAccount.displayName})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="scheduledStart" className="block text-sm font-medium text-zinc-300">Scheduled start *</label>
          <input id="scheduledStart" name="scheduledStart" type="datetime-local" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </div>
        <div>
          <label htmlFor="scheduledEnd" className="block text-sm font-medium text-zinc-300">Scheduled end</label>
          <input id="scheduledEnd" name="scheduledEnd" type="datetime-local" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </div>
      </div>
      <div>
        <label htmlFor="payoutDollars" className="block text-sm font-medium text-zinc-300">Payout ($) *</label>
        <input id="payoutDollars" name="payoutDollars" type="number" step="0.01" min="0" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" placeholder="85.00" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
          {isSubmitting ? "Creating…" : "Create job"}
        </button>
        <Link href="/admin/jobs" className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800">
          Cancel
        </Link>
      </div>
    </form>
  );
}
