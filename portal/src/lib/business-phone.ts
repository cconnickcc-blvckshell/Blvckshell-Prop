import { company } from "@/config/marketing-site";

/**
 * Business phone for tel: links and structured data.
 * Production release blocked until BUSINESS_PHONE_E164 is set by owner.
 */
export function getVerifiedBusinessPhoneE164(): string | null {
  const fromEnv = process.env.BUSINESS_PHONE_E164?.trim();
  if (fromEnv) return fromEnv;
  return company.phone.telE164Verified;
}

/** Vanity display only — not dialable until verified. */
export function getBusinessPhoneDisplay(): string {
  return company.phone.displayVanity;
}
