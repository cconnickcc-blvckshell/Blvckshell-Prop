import Link from "next/link";

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500";

export default function LoginForm({
  callbackUrl,
  error,
  notice,
}: {
  callbackUrl: string;
  error: string | null;
  notice: string | null;
}) {
  return (
    <form method="post" action="/api/auth/login" className="mt-8 space-y-6" data-auth-form="login">
      {notice === "password-set" && (
        <div className="rounded-md bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Password updated. You can sign in with it now.</p>
        </div>
      )}
      {error === "RateLimit" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          Too many login attempts. Please wait a few minutes and try again.
        </div>
      )}
      {error === "CredentialsSignin" && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Invalid email or password</p>
        </div>
      )}
      {error && error !== "RateLimit" && error !== "CredentialsSignin" && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Sign-in could not be completed. Try again.</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
        <p className="mt-2 text-right text-sm">
          <Link href="/forgot-password" className="text-zinc-300 hover:text-white">
            Forgot password?
          </Link>
        </p>
      </div>

      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <button
          type="submit"
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
