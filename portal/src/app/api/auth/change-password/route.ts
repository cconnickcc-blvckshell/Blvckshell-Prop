import { changeOwnPassword } from "@/server/actions/password-actions";
import { field, isNextRedirect, logAuthFailure, rejectCrossSite, seeOther } from "@/lib/auth-post";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return seeOther(request, "/account/password");
}

function changeErrorCode(error: string): "incorrect" | "weak" {
  if (error === "Current password is incorrect.") return "incorrect";
  return "weak";
}

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther(request, "/account/password?error=invalid");
  }

  const currentPassword = field(form, "currentPassword");
  const password = field(form, "password");
  if (!currentPassword || !password) {
    return seeOther(request, "/account/password?error=invalid");
  }

  try {
    const result = await changeOwnPassword(currentPassword, password);
    if (!result.ok) {
      return seeOther(request, `/account/password?error=${changeErrorCode(result.error)}`);
    }
    return seeOther(request, "/account/password?updated=1");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: unknown }).digest) : "";
    if (digest === "UNAUTHORIZED") {
      return seeOther(request, "/login?callbackUrl=/account/password");
    }
    logAuthFailure("auth.change-password");
    return seeOther(request, "/account/password?error=invalid");
  }
}
