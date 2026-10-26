"use server";

import { activateAccountWithToken } from "@/lib/account-activation";

export async function completeAccountActivation(token: string, password: string) {
  return activateAccountWithToken(token, password);
}
