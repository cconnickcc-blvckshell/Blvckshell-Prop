"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWorkforceSettings } from "@/app/admin/workforce/actions";
import { sendUserPasswordReset } from "@/server/actions/password-actions";

type UserRow = { id: string; name: string; email: string; role: string };

export default function WorkforceAccountControls({
  accountId,
  classification,
  allowedPaymentMethod,
  users,
}: {
  accountId: string;
  classification: string;
  allowedPaymentMethod: string;
  users: UserRow[];
}) {
  const router = useRouter();
  const [classificationValue, setClassificationValue] = useState(classification);
  const [paymentValue, setPaymentValue] = useState(allowedPaymentMethod);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveSettings() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateWorkforceSettings(accountId, {
        classification: classificationValue,
        allowedPaymentMethod: paymentValue,
      });
      if (result.error) setError(result.error);
      else {
        setMessage("Classification and payment method saved.");
        router.refresh();
      }
    });
  }

  function resetPassword(userId: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await sendUserPasswordReset(userId);
      if (!result.ok) setError(result.error);
      else setMessage(result.message);
    });
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-md bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">{message}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-300">
          Classification
          <select
            value={classificationValue}
            onChange={(event) => setClassificationValue(event.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="CONTRACTOR">Contractor</option>
          </select>
        </label>
        <label className="block text-sm text-zinc-300">
          Payment method
          <select
            value={paymentValue}
            onChange={(event) => setPaymentValue(event.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          >
            <option value="PAYROLL">Payroll</option>
            <option value="EFT">EFT</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={saveSettings}
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save classification"}
      </button>
      {users.length > 0 && (
        <div className="border-t border-zinc-800 pt-4">
          <h3 className="text-sm font-semibold text-white">Password reset</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Sends a temporary password by email. The password is not shown here.
          </p>
          <ul className="mt-3 space-y-2">
            {users.map((accountUser) => (
              <li key={accountUser.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-zinc-300">
                  {accountUser.name} <span className="text-zinc-500">{accountUser.email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => resetPassword(accountUser.id)}
                  disabled={pending}
                  className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Send password reset
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
