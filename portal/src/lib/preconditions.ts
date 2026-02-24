import type { JobStatus, InvoiceStatus } from "@prisma/client";
import { prisma } from "./prisma";

export interface PreconditionResult {
  passed: boolean;
  failures: PreconditionFailure[];
}

export interface PreconditionFailure {
  code: string;
  message: string;
}

/**
 * Pre-flight check for job approval (COMPLETED_PENDING_APPROVAL -> APPROVED_PAYABLE).
 * Returns structured errors the UI can render as "why is this blocked?"
 */
export async function checkJobApprovalPreconditions(
  jobId: string
): Promise<PreconditionResult> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      status: true,
      payoutAmountCents: true,
      billableAmountCents: true,
      assignedWorkerId: true,
      assignedWorkforceAccountId: true,
      site: { select: { requiredPhotoCount: true } },
      checklistRuns: {
        where: { status: "Submitted" },
        select: { id: true },
      },
      completion: {
        select: {
          evidence: { select: { id: true } },
        },
      },
    },
  });

  if (!job) {
    return { passed: false, failures: [{ code: "NOT_FOUND", message: "Job not found" }] };
  }

  const failures: PreconditionFailure[] = [];

  if (job.status !== "COMPLETED_PENDING_APPROVAL") {
    failures.push({
      code: "WRONG_STATUS",
      message: `Job must be in COMPLETED_PENDING_APPROVAL status (currently ${job.status})`,
    });
  }

  if (job.checklistRuns.length === 0) {
    failures.push({
      code: "NO_SUBMITTED_CHECKLIST",
      message: "No submitted checklist run found. Worker must complete and submit the checklist.",
    });
  }

  const billable = job.billableAmountCents ?? job.payoutAmountCents;
  if (billable == null || job.payoutAmountCents == null) {
    failures.push({
      code: "NO_BILLABLE_AMOUNT",
      message: "Job must have billableAmountCents or payoutAmountCents set before approval.",
    });
  }

  const evidenceCount = job.completion?.evidence?.length ?? 0;
  const requiredPhotos = job.site.requiredPhotoCount;
  if (evidenceCount < requiredPhotos) {
    failures.push({
      code: "INSUFFICIENT_EVIDENCE",
      message: `${evidenceCount} of ${requiredPhotos} required photos submitted.`,
    });
  }

  return { passed: failures.length === 0, failures };
}

/**
 * Pre-flight check for invoice send (Draft -> Sent).
 */
export async function checkInvoiceSendPreconditions(
  invoiceId: string
): Promise<PreconditionResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      status: true,
      lineItems: { select: { id: true, isSystemPlaceholder: true } },
      totalCents: true,
    },
  });

  if (!invoice) {
    return { passed: false, failures: [{ code: "NOT_FOUND", message: "Invoice not found" }] };
  }

  const failures: PreconditionFailure[] = [];

  if (invoice.status !== "Draft") {
    failures.push({
      code: "WRONG_STATUS",
      message: `Invoice must be in Draft status (currently ${invoice.status})`,
    });
  }

  if (invoice.lineItems.length === 0) {
    failures.push({
      code: "NO_LINE_ITEMS",
      message: "Cannot send invoice with zero line items. Add jobs or contract base first.",
    });
  }

  const placeholders = invoice.lineItems.filter((li) => li.isSystemPlaceholder);
  if (placeholders.length > 0) {
    failures.push({
      code: "HAS_PLACEHOLDERS",
      message: `Invoice has ${placeholders.length} system placeholder line item(s) that must be resolved.`,
    });
  }

  return { passed: failures.length === 0, failures };
}

/**
 * Pre-flight check for payout batch finalization.
 */
export async function checkPayoutFinalizePreconditions(
  batchId: string
): Promise<PreconditionResult> {
  const batch = await prisma.payoutBatch.findUnique({
    where: { id: batchId },
    select: {
      status: true,
      payoutLines: {
        select: {
          id: true,
          jobId: true,
          workforceAccount: {
            select: { complianceSuspended: true, isActive: true, displayName: true },
          },
        },
      },
    },
  });

  if (!batch) {
    return { passed: false, failures: [{ code: "NOT_FOUND", message: "Payout batch not found" }] };
  }

  const failures: PreconditionFailure[] = [];

  if (batch.status === "PAID") {
    failures.push({ code: "ALREADY_PAID", message: "Batch is already marked as paid" });
  }

  if (batch.payoutLines.length === 0) {
    failures.push({ code: "NO_LINES", message: "Payout batch has no payout lines" });
  }

  const suspendedLines = batch.payoutLines.filter(
    (l) => l.workforceAccount.complianceSuspended
  );
  if (suspendedLines.length > 0) {
    const names = suspendedLines.map((l) => l.workforceAccount.displayName);
    failures.push({
      code: "COMPLIANCE_SUSPENDED",
      message: `${suspendedLines.length} workforce account(s) are compliance-suspended: ${names.join(", ")}`,
    });
  }

  const inactiveLines = batch.payoutLines.filter(
    (l) => !l.workforceAccount.isActive
  );
  if (inactiveLines.length > 0) {
    failures.push({
      code: "INACTIVE_ACCOUNTS",
      message: `${inactiveLines.length} workforce account(s) are inactive.`,
    });
  }

  return { passed: failures.length === 0, failures };
}
