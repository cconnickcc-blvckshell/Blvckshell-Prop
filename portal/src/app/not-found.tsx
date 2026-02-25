import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md space-y-4 text-center">
        <div className="text-6xl font-bold text-zinc-700">404</div>
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Go home
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
