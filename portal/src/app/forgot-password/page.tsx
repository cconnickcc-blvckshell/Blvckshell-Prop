import Link from "next/link";
import PortalBrandMark from "@/components/PortalBrandMark";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8">
        <PortalBrandMark variant="header" className="mx-auto w-full max-w-[16rem]" />
        <div>
          <h1 className="text-lg font-semibold text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-zinc-400">
            We email a temporary password. It is never shown on this page.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="hover:text-zinc-300">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
