const ERRORS: Record<string, string> = {
  mismatch: "Passwords do not match.",
  weak: "At least 8 characters, with an uppercase letter, a lowercase letter, and a number.",
  invalid: "This link is invalid or has expired.",
  rate: "Too many attempts. Wait a few minutes and try again.",
};

export default function SetPasswordForm({ token, error }: { token: string; error: string | null }) {
  return (
    <form method="post" action="/api/auth/reset-password" className="space-y-4" data-auth-form="reset">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="next" className="block text-sm font-medium text-zinc-300">
          New password
        </label>
        <input
          id="next"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
        />
        <p className="mt-1 text-xs text-zinc-500">
          At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
        </p>
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-zinc-300">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
        />
      </div>
      {error && ERRORS[error] && (
        <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{ERRORS[error]}</p>
      )}
      <button
        type="submit"
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
      >
        Set password
      </button>
    </form>
  );
}
