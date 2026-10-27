"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/server/actions/password-actions";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await requestPasswordReset(email);
    setMessage(result.message);
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
        />
      </div>
      {message && (
        <p className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200">{message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Email a set-password link"}
      </button>
    </form>
  );
}
