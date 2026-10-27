"use client";

import { useState } from "react";
import { changeOwnPassword } from "@/server/actions/password-actions";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const result = await changeOwnPassword(currentPassword, nextPassword);
    setPending(false);
    if (result.ok) {
      setMessage(result.message);
      setCurrentPassword("");
      setNextPassword("");
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="current" className="block text-sm font-medium text-zinc-300">
          Current password
        </label>
        <input
          id="current"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
        />
      </div>
      <div>
        <label htmlFor="next" className="block text-sm font-medium text-zinc-300">
          New password
        </label>
        <input
          id="next"
          type="password"
          required
          autoComplete="new-password"
          value={nextPassword}
          onChange={(event) => setNextPassword(event.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
        />
        <p className="mt-1 text-xs text-zinc-500">At least 8 characters, with an uppercase letter, a lowercase letter, and a number.</p>
      </div>
      {error && <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-md bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">{message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
