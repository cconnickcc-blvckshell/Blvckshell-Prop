import { UserRole } from "@prisma/client";

/** Full admin portal access (operations UI, most mutations). */
export function isStaffAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "FOUNDER";
}

/** Founder-only financial overrides (pricing policy, payout ceilings, revenue floor). */
export function isFounderFinancialAuthority(role: UserRole): boolean {
  return role === "FOUNDER";
}

/** Job approval, cancel, payout marking — operations admin, not client/worker. */
export function isOperationsAdmin(role: UserRole): boolean {
  return isStaffAdmin(role);
}
