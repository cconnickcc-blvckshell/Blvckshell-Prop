import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/server/guards/rbac";
import { createDraftInvoiceInternal } from "@/server/actions/invoice-actions";
import type { BulkPreviewResult, BulkResult } from "./index";
import type { Prisma } from "@prisma/client";

/**
 * Preview: check client exists and whether a draft already exists for the period.
 */
export async function validateBulkGenerateDrafts(
  clientId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<BulkPreviewResult> {
  const valid: BulkPreviewResult["valid"] = [];
  const invalid: BulkPreviewResult["invalid"] = [];

  const client = await prisma.clientOrganization.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) {
    return {
      valid: [],
      invalid: [{ id: clientId, currentState: "—", intendedAction: "generate_draft", error: "Client not found" }],
      summary: "Client not found",
    };
  }

  const existing = await prisma.invoice.findFirst({
    where: { clientId, status: "Draft", periodStart, periodEnd },
    select: { id: true },
  });
  if (existing) {
    return {
      valid: [],
      invalid: [
        {
          id: clientId,
          currentState: "Draft exists",
          intendedAction: "generate_draft",
          error: "A draft invoice already exists for this client and period",
        },
      ],
      summary: "Draft already exists for this period",
    };
  }

  valid.push({
    id: clientId,
    currentState: "No draft",
    intendedAction: "generate_draft",
  });
  return { valid, invalid, summary: "1 draft will be created" };
}

/**
 * Execute: create one draft for client + period, then write one audit entry per created invoice.
 */
export async function executeBulkGenerateDrafts(
  user: SessionUser,
  clientId: string,
  periodStart: Date,
  periodEnd: Date,
  bulkOperationId: string
): Promise<BulkResult<string>> {
  const succeeded: string[] = [];
  const failed: BulkResult["failed"] = [];

  const result = await createDraftInvoiceInternal(clientId, periodStart, periodEnd, user.id);
  if (!result.success || !result.invoiceId) {
    failed.push({ id: clientId, code: "CREATE_FAILED", message: result.error ?? "Failed to create draft" });
    return { bulkOperationId, succeeded, failed };
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "Invoice",
      entityId: result.invoiceId,
      metadata: {
        bulkOperationId,
        action: "DraftCreated",
        clientId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
  succeeded.push(result.invoiceId);
  return { bulkOperationId, succeeded, failed };
}
