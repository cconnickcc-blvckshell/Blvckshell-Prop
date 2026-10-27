import { signIn } from "@/lib/auth";
import { field, isNextRedirect, loginResultPath, logAuthFailure, rejectCrossSite, seeOther } from "@/lib/auth-post";
import { publicOriginFrom, safeInternalPath } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return seeOther(request, "/login?error=method");
}

export function HEAD(request: Request) {
  return seeOther(request, "/login?error=method");
}

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther(request, "/login?error=CredentialsSignin");
  }

  const email = field(form, "email").trim();
  const password = field(form, "password");
  const callbackUrl = safeInternalPath(field(form, "callbackUrl"), "/portal");
  if (!email || !password) {
    return seeOther(request, "/login?error=CredentialsSignin");
  }

  try {
    const destination = await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
      redirect: false,
    });
    const target = loginResultPath(destination, publicOriginFrom(request), callbackUrl);
    return seeOther(request, target);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    logAuthFailure("auth.login");
    return seeOther(request, "/login?error=CredentialsSignin");
  }
}
