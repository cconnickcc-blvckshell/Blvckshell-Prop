"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadComplianceDocument } from "@/app/admin/workforce/actions";

export default function ComplianceDocumentForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("workforceAccountId", accountId);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await uploadComplianceDocument(formData);
      if (result.error) setError(result.error);
      else {
        setMessage("Document saved.");
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-emerald-300">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-zinc-300">
          Type
          <select name="type" required className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white">
            <option value="COI">COI</option>
            <option value="WSIB">WSIB</option>
            <option value="AGREEMENT">Agreement</option>
            <option value="HST">HST</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="block text-sm text-zinc-300">
          Expires
          <input name="expiresAt" type="date" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
        </label>
        <label className="block text-sm text-zinc-300">
          File
          <input name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm text-zinc-300" />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload document"}
      </button>
    </form>
  );
}
