/**
 * Operations notification routing (server-only).
 * Do not hardcode unverified mailboxes in business logic.
 */

/** Verified recipient for new leads, applications, and ops alerts. Must be set in production. */
export function getOperationsNotificationEmail(): string | null {
  const value =
    process.env.OPERATIONS_NOTIFICATION_EMAIL?.trim() ||
    process.env.LEAD_NOTIFICATION_EMAIL?.trim() ||
    null;
  return value || null;
}

export function isOperationsNotificationConfigured(): boolean {
  return Boolean(getOperationsNotificationEmail());
}
