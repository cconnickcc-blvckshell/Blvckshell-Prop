/**
 * Shared formatting utilities for human-readable display.
 * All user-facing text should use these instead of raw enum/code values.
 */

import { TORONTO_TZ } from "@/lib/toronto-time";

const JOB_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED_PENDING_APPROVAL: "Pending Approval",
  APPROVED_PAYABLE: "Approved",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  ASSIGNED: "Assigned",
  COMPLETED: "Completed",
  INVOICED: "Invoiced",
  PAID: "Paid",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  Draft: "Draft",
  Sent: "Sent",
  Paid: "Paid",
  Void: "Void",
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  CALCULATED: "Calculated",
  APPROVED: "Approved",
  RELEASED: "Released",
  PAID: "Paid",
  PENDING: "Pending",
  VOID: "Void",
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY_FOR_REVIEW: "Ready for Review",
  SENT: "Sent",
  WON: "Won",
  LOST: "Lost",
  EXPIRED: "Expired",
};

const CHECKLIST_RUN_STATUS_LABELS: Record<string, string> = {
  InProgress: "In Progress",
  Submitted: "Submitted",
  Approved: "Approved",
  Rejected: "Rejected",
};

const SNAPSHOT_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SETTLED: "Settled",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const TIME_ENTRY_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  EXPORTED: "Exported",
  PAID: "Paid",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  FOUNDER: "Founder",
  CLIENT: "Client",
  VENDOR_OWNER: "Vendor Owner",
  VENDOR_WORKER: "Vendor Worker",
  INTERNAL_WORKER: "Internal Worker",
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  SAFETY: "Safety",
  PROPERTY_DAMAGE: "Property Damage",
  BIOHAZARD: "Biohazard",
  LOST_KEY: "Lost Key",
  OTHER: "Other",
};

const WORKFORCE_TYPE_LABELS: Record<string, string> = {
  INTERNAL: "Internal",
  VENDOR: "Vendor",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  CONTRACTOR: "Contractor",
};

const PAYMENT_RAIL_LABELS: Record<string, string> = {
  STRIPE: "Stripe",
  SPARC: "SparcPay",
  EFT: "EFT",
  CHEQUE: "Cheque",
  PAYROLL: "Payroll",
};

export function formatJobStatus(status: string): string {
  return JOB_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function formatWorkOrderStatus(status: string): string {
  return WORK_ORDER_STATUS_LABELS[status] ?? status;
}

export function formatInvoiceStatus(status: string): string {
  return INVOICE_STATUS_LABELS[status] ?? status;
}

export function formatPayoutStatus(status: string): string {
  return PAYOUT_STATUS_LABELS[status] ?? status;
}

export function formatQuoteStatus(status: string): string {
  return QUOTE_STATUS_LABELS[status] ?? status;
}

export function formatChecklistRunStatus(status: string): string {
  return CHECKLIST_RUN_STATUS_LABELS[status] ?? status;
}

export function formatSnapshotStatus(status: string): string {
  return SNAPSHOT_STATUS_LABELS[status] ?? status;
}

export function formatPaymentStatus(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function formatTimeEntryStatus(status: string): string {
  return TIME_ENTRY_STATUS_LABELS[status] ?? status;
}

export function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export function formatIncidentType(type: string): string {
  return INCIDENT_TYPE_LABELS[type] ?? type;
}

export function formatWorkforceType(type: string): string {
  return WORKFORCE_TYPE_LABELS[type] ?? type;
}

export function formatClassification(classification: string): string {
  return CLASSIFICATION_LABELS[classification] ?? classification;
}

export function formatPaymentRail(rail: string): string {
  return PAYMENT_RAIL_LABELS[rail] ?? rail;
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function asDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

/** Calendar dates stored as UTC midnight (policy effective dates, period starts). */
function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

export function formatDate(date: Date | string): string {
  const d = asDate(date);
  return d.toLocaleDateString("en-CA", {
    timeZone: isUtcMidnight(d) ? "UTC" : TORONTO_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Date-only value. Does not shift UTC midnight into the previous Toronto day. */
export function formatCalendarDate(date: Date | string): string {
  const d = asDate(date);
  return d.toLocaleDateString("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = asDate(date);
  return d.toLocaleString("en-CA", {
    timeZone: TORONTO_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string): string {
  const d = asDate(date);
  return d.toLocaleTimeString("en-CA", {
    timeZone: TORONTO_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function metaString(meta: Record<string, unknown>, key: string): string | null {
  const value = meta[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Activity-feed sentence: who did what, plus a name when the audit metadata has one. */
export function describeAuditActivity(log: {
  entityType: string;
  fromState: string | null;
  toState: string | null;
  metadata: unknown;
  actorName: string | null;
}): string {
  const meta =
    log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
      ? (log.metadata as Record<string, unknown>)
      : {};
  const actor = log.actorName?.trim() || "Someone";
  const name =
    metaString(meta, "displayName") ||
    metaString(meta, "name") ||
    metaString(meta, "email") ||
    metaString(meta, "siteName");
  const entity = log.entityType.replace(/([a-z])([A-Z])/g, "$1 $2");
  const subject = name ? `${entity} · ${name}` : entity;
  if (log.fromState && log.toState) {
    return `${actor} · ${subject} · ${log.fromState} → ${log.toState}`;
  }
  const action = metaString(meta, "action");
  const verb =
    action === "create" || log.toState === "CREATED"
      ? "created"
      : log.toState
        ? log.toState.toLowerCase().replace(/_/g, " ")
        : "updated";
  return `${actor} ${verb} ${subject}`;
}
