const ERRORS: Record<string, string> = {
  incorrect: "Current password is incorrect.",
  weak: "At least 8 characters, with an uppercase letter, a lowercase letter, and a number.",
  invalid: "Password could not be updated.",
};

export default function ChangePasswordForm({
  error,
  updated,
}: {
  error: string | null;
  updated: boolean;
}) {
  return (
    <form method="post" action="/api/auth/change-password" className="space-y-4" data-auth-form="change">
      <div>
        <label htmlFor="current" className="block text-sm font-medium text-zinc-300">
          Current password
        </label>
        <input
          id="current"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
        />
      </div>
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
      {error && ERRORS[error] && (
        <p className="rounded-md bg-red-500/20 px-3 py-2 text-sm text-red-300">{ERRORS[error]}</p>
      )}
      {updated && (
        <p className="rounded-md bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">Password updated.</p>
      )}
      <button
        type="submit"
        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
      >
        Update password
      </button>
    </form>
  );
}
