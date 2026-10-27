import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards/rbac";
import ChangePasswordForm from "@/components/forms/ChangePasswordForm";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const back =
    user.role === "ADMIN" || user.role === "FOUNDER"
      ? "/admin"
      : user.role === "CLIENT"
        ? "/client"
        : "/profile";

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div>
          <Link href={back} className="text-sm text-zinc-400 hover:text-white">
            ← Back
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">Change password</h1>
          <p className="mt-1 text-sm text-zinc-400">Signed in as {user.name}</p>
        </div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
