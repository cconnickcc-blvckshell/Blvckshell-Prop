import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/forms/LoginForm";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    // Redirect based on role
    if (session.user.role === "ADMIN") {
      redirect("/admin/jobs");
    } else {
      redirect("/jobs");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            BLVCKSHELL Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
