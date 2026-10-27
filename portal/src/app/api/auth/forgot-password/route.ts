import { requestPasswordReset } from "@/server/actions/password-actions";
import { field, isNextRedirect, logAuthFailure, rejectCrossSite, seeOther } from "@/lib/auth-post";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return seeOther(request, "/forgot-password");
}

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther(request, "/forgot-password?status=sent");
  }

  try {
    const result = await requestPasswordReset(field(form, "email"));
    const status = "unavailable" in result && result.unavailable ? "unavailable" : "sent";
    return seeOther(request, `/forgot-password?status=${status}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    logAuthFailure("auth.forgot-password");
    return seeOther(request, "/forgot-password?status=sent");
  }
}
