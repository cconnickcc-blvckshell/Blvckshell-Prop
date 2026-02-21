import { prisma } from "@/lib/prisma";
import { createDraftInvoiceInternal, addJobToInvoiceInternal } from "@/server/actions/invoice-actions";
import type { SessionUser } from "@/server/guards/rbac";

const REASON = "APPROVED_PAYABLE";

/**
 * Ensure a job in APPROVED_PAYABLE is on a Draft invoice for its client and period.
 * Idempotent: if job.invoiceId is already set, no-op.
 * Creates draft if none exists for client + month of job.scheduledStart.
 * Writes audit: Invoice entity with metadata { action: "JobAddedByAutomation", jobId, reason }.
 */
export async function ensureJobOnDraftInvoice(
  actor: SessionUser,
  jobId: string
): Promise<{ done: boolean; invoiceId?: string; error?: string }> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      invoiceId: true,
      scheduledStart: true,
      siteId: true,
      site: { select: { clientOrganizationId: true } },
    },
  });

  if (!job) return { done: false, error: "Job not found" };
  if (job.status !== "APPROVED_PAYABLE") return { done: false, error: "Job not in APPROVED_PAYABLE" };
  if (job.invoiceId != null) return { done: true }; // idempotent: already on an invoice

  const clientId = job.site.clientOrganizationId;
  const d = new Date(job.scheduledStart);
  const periodStart = new Date(d.getFullYear(), d.getMonth(), 1);
  const periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

  let draft = await prisma.invoice.findFirst({
    where: {
      clientId,
      status: "Draft",
      periodStart: { lte: periodEnd },
      periodEnd: { gte: periodStart },
    },
    select: { id: true },
  });

  if (!draft) {
    const created = await createDraftInvoiceInternal(
      clientId,
      periodStart,
      periodEnd,
      actor.id
    );
    if (!created.success || !created.invoiceId) {
      return { done: false, error: created.error ?? "Failed to create draft invoice" };
    }
    draft = { id: created.invoiceId };
  }

  const result = await addJobToInvoiceInternal(
    actor.id,
    draft.id,
    jobId,
    { reason: REASON }
  );

  if (!result.success) return { done: false, error: result.error ?? "Failed to add job to invoice" };
  return { done: true, invoiceId: draft.id };
}
