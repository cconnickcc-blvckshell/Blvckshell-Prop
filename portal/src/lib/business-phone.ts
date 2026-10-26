import { company } from "@/config/marketing-site";

/** Business phone for tel: links and structured data (defaults from marketing-site; env overrides). */
export function getVerifiedBusinessPhoneE164(): string | null {
  const fromEnv = process.env.BUSINESS_PHONE_E164?.trim();
  if (fromEnv) return fromEnv;
  return company.phone.telE164Verified;
}

export function getBusinessPhoneDisplay(): string {
  return company.phone.displayVanity;
}
