"use client";

import { useState } from "react";
import Link from "next/link";
import { completePasswordReset } from "@/server/actions/password-actions";

export default function SetPasswordForm({ token }: { token: string }) {
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (nextPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    const result = await completePasswordReset(token, nextPassword);
    setPending(false);
    if (result.ok) {
      setMessage(result.message);
      setNextPassword("");
      setConfirm("");
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
        />
      </div>
      {error && <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && (
        <p className="rounded-md bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">
          {message}{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !token}
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}
