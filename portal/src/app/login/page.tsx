import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";

export default async function LoginPage() {
  let session = null;

  try {
    session = await auth();
  } catch (err) {
    // Log server-side only (Vercel captures this). Do not throw — avoid 500.
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorName = err instanceof Error ? err.name : "UnknownError";
    console.error("[login] Auth/session check failed:", {
      error: errorMessage,
      name: errorName,
      stack: err instanceof Error ? err.stack : undefined,
      // Diagnostic info (don't log sensitive values)
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    });
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
          <h1 className="text-xl font-bold tracking-tight">Portal temporarily unavailable</h1>
          <p className="text-sm text-zinc-400">
            We’re updating our systems. Please try again in a few minutes, or contact us if this persists.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/"
              className="rounded-lg bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
            >
              Back to home
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-zinc-600 px-4 py-2.5 text-center text-sm font-medium text-zinc-300 hover:border-zinc-500"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (session) {
    if (session.user.role === "ADMIN") {
      redirect("/admin/jobs");
    } else {
      redirect("/jobs");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            BLVCKSHELL Portal
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Sign in to your account
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-400">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
