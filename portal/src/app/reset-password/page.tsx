import Link from "next/link";
import PortalBrandMark from "@/components/PortalBrandMark";
import SetPasswordForm from "@/components/forms/SetPasswordForm";

export const metadata = { title: "Set password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8">
        <PortalBrandMark variant="header" className="mx-auto w-full max-w-[16rem]" />
        <div>
          <h1 className="text-lg font-semibold text-white">Set your password</h1>
          <p className="mt-1 text-sm text-zinc-400">
            This link works once. Your password changes only when you submit this form.
          </p>
        </div>
        {token ? (
          <SetPasswordForm token={token} />
        ) : (
          <p className="rounded-md bg-amber-500/20 px-3 py-2 text-sm text-amber-200">
            This link is missing a token. Ask an admin to send a new one.
          </p>
        )}
        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="hover:text-zinc-300">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
