"use server";

import { activateAccountWithToken } from "@/lib/account-activation";
import { assertActivationRateLimit } from "@/lib/activation-rate-limit";

export async function completeAccountActivation(token: string, password: string) {
  const limited = await assertActivationRateLimit();
  if (!limited.ok) return limited;
  return activateAccountWithToken(token, password);
}
