"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";
import { completeAccountActivation } from "@/server/actions/account-activation-actions";

function ActivateForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    const result = await completeAccountActivation(token, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/login?activated=1");
  }

  if (!token) {
    return (
      <p className="text-red-400">Missing activation token. Use the link from your email.</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-md space-y-4">
      <p className="text-sm text-zinc-400">
        Choose a password (minimum 10 characters). This link expires in 72 hours.
      </p>
      <div>
        <label className="block text-sm text-zinc-300" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={10}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-300" htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={10}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Activate account"}
      </button>
    </form>
  );
}

export default function ActivateAccountPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-[var(--brand-gold,#d4af37)]">Activate your account</h1>
        <Suspense fallback={<p className="mt-4 text-zinc-400">Loading…</p>}>
          <ActivateForm />
        </Suspense>
      </div>
    </main>
  );
}
