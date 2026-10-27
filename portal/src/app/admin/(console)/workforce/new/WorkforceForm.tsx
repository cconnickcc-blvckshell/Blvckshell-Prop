"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type State = { error?: string; success?: boolean; accountId?: string; inviteSent?: boolean };

export default function WorkforceForm({
  action,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean; accountId?: string; inviteSent?: boolean }>;
}) {
  const router = useRouter();
  const [type, setType] = useState<"VENDOR" | "INTERNAL">("VENDOR");
  const [state, setState] = useState<State | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    setIsSubmitting(true);
    setState(undefined);
    const result = await action(formData);
    setState(result);
    setIsSubmitting(false);
    if (result.success && result.accountId && result.inviteSent !== false) {
      router.push(`/admin/workforce/${result.accountId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <input type="hidden" name="type" value={type} />
      {state?.error && (
        <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}
      {state?.success && state.inviteSent === false && state.accountId && (
        <p className="rounded-md bg-amber-500/20 px-3 py-2 text-sm text-amber-200">
          Account created. No set-password link was sent, and no password was shown or stored.{" "}
          <Link href={`/admin/workforce/${state.accountId}`} className="underline">
            Open the account
          </Link>{" "}
          and send a link once email delivery is configured.
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-zinc-300">Account type *</label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="VENDOR" checked={type === "VENDOR"} onChange={() => setType("VENDOR")} className="rounded border-zinc-600 bg-zinc-800" />
            <span className="text-zinc-300">Subcontractor (Vendor)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="type" value="INTERNAL" checked={type === "INTERNAL"} onChange={() => setType("INTERNAL")} className="rounded border-zinc-600 bg-zinc-800" />
            <span className="text-zinc-300">Internal employee</span>
          </label>
        </div>
      </div>
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-zinc-300">Display name *</label>
        <input id="displayName" name="displayName" type="text" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" placeholder={type === "VENDOR" ? "e.g. CleanPro Subcontractors" : "e.g. BLVCKSHELL Internal"} />
      </div>
      {type === "VENDOR" && (
        <div>
          <label htmlFor="legalName" className="block text-sm font-medium text-zinc-300">Legal name</label>
          <input id="legalName" name="legalName" type="text" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" placeholder="Inc. / Ltd." />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="primaryContactName" className="block text-sm font-medium text-zinc-300">Primary contact name *</label>
          <input id="primaryContactName" name="primaryContactName" type="text" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </div>
        <div>
          <label htmlFor="primaryContactEmail" className="block text-sm font-medium text-zinc-300">Primary contact email *</label>
          <input id="primaryContactEmail" name="primaryContactEmail" type="email" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </div>
        <div>
          <label htmlFor="primaryContactPhone" className="block text-sm font-medium text-zinc-300">Primary contact phone *</label>
          <input id="primaryContactPhone" name="primaryContactPhone" type="tel" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </div>
      </div>
      {type === "VENDOR" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="hstNumber" className="block text-sm font-medium text-zinc-300">HST number</label>
            <input id="hstNumber" name="hstNumber" type="text" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
          </div>
          <div>
            <label htmlFor="wsibAccountNumber" className="block text-sm font-medium text-zinc-300">WSIB account</label>
            <input id="wsibAccountNumber" name="wsibAccountNumber" type="text" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
          </div>
        </div>
      )}
      <hr className="border-zinc-800" />
      <p className="text-sm font-medium text-zinc-300">First user {type === "VENDOR" ? "(vendor owner)" : "(internal worker)"}</p>
      <p className="text-sm text-zinc-500">
        A one-time set-password link is emailed. You will not see or type a password, and none is stored in the notification log.
        {type === "INTERNAL" ? " Internal accounts are employees paid through payroll." : " Vendor owners are labeled separately from cleaners."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-zinc-300">Name *</label>
          <input id="userName" name="userName" type="text" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </div>
        <div>
          <label htmlFor="userEmail" className="block text-sm font-medium text-zinc-300">Email *</label>
          <input id="userEmail" name="userEmail" type="email" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </div>
      </div>
      <div>
        <label htmlFor="userPhone" className="block text-sm font-medium text-zinc-300">Phone</label>
        <input id="userPhone" name="userPhone" type="tel" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
          {isSubmitting ? "Creating…" : "Create account"}
        </button>
        <Link href="/admin/workforce" className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800">
          Cancel
        </Link>
      </div>
    </form>
  );
}
