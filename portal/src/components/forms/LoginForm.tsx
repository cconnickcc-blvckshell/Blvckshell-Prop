import Link from "next/link";
import Button from "@/components/ui/Button";
import Field, { fieldControlClass } from "@/components/ui/Field";

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

      <Field id="email" label="Email address">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldControlClass}
        />
      </Field>

      <Field
        id="password"
        label="Password"
        hint={
          <p className="mt-2 text-right text-sm">
            <Link href="/forgot-password" className="text-[var(--brand-silver)] hover:text-white">
              Forgot password?
            </Link>
          </p>
        }
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldControlClass}
        />
      </Field>

      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </div>
    </form>
  );
}
