const SENT =
  "If an account exists for that email, a one-time set-password link is on its way. Your current password is unchanged.";
const UNAVAILABLE = "Password reset by email is unavailable. Contact an admin.";

export default function ForgotPasswordForm({ status }: { status: string | null }) {
  return (
    <form method="post" action="/api/auth/forgot-password" className="space-y-4" data-auth-form="forgot">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
        />
      </div>
      {status === "sent" && (
        <p className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200">{SENT}</p>
      )}
      {status === "unavailable" && (
        <p className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200">{UNAVAILABLE}</p>
      )}
      <button
        type="submit"
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
      >
        Email a set-password link
      </button>
    </form>
  );
}
