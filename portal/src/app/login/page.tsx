import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards/rbac";
import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";
import PortalBrandMark from "@/components/PortalBrandMark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const rateLimited = params.error === "RateLimit";
  let user = null;

  try {
    user = await getCurrentUser();
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

  if (user) {
    if (user.role === "ADMIN" || user.role === "FOUNDER") {
      redirect("/admin");
    }
    if (user.role === "CLIENT") {
      redirect("/client");
    }
    redirect("/jobs");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <PortalBrandMark variant="header" className="w-full max-w-[16rem]" />
          <div>
            <h2 className="text-center text-lg font-semibold tracking-tight text-white sm:text-xl">
              Portal sign in
            </h2>
            <p className="mt-1 text-center text-sm text-zinc-400">
              Workforce, client, and admin access
            </p>
          </div>
        </div>
        {rateLimited && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
            Too many login attempts. Please wait a few minutes and try again.
          </div>
        )}
        <LoginForm />
        <p className="text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-400">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
