"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { flagOverdueApprovals } from "@/server/automation/flagOverdueApprovals";
import { generateBulkOperationId } from "@/server/bulk-actions";
import {
  validateBulkJobAction,
  executeBulkJobAction,
  type BulkJobAction,
} from "@/server/bulk-actions/jobs";
import {
  validateBulkGenerateDrafts,
  executeBulkGenerateDrafts,
} from "@/server/bulk-actions/invoices";
import {
  validateBulkResolveIncidents,
  executeBulkResolveIncidents,
} from "@/server/bulk-actions/incidents";
import {
  validateBulkWorkOrderTransition,
  executeBulkWorkOrderTransition,
} from "@/server/bulk-actions/work-orders";
import type { WorkOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- Jobs ---

export async function previewBulkJobAction(
  jobIds: string[],
  action: BulkJobAction,
  options: { sharedReason?: string }
) {
  const user = await requireAdmin();
  return validateBulkJobAction(user, jobIds, action, options);
}

export async function executeBulkJobActionAction(
  jobIds: string[],
  action: BulkJobAction,
  options: { sharedReason?: string }
) {
  const user = await requireAdmin();
  const bulkOperationId = generateBulkOperationId();
  const result = await executeBulkJobAction(user, jobIds, action, bulkOperationId, options);
  revalidatePath("/admin/jobs");
  return result;
}

// --- Invoices ---

export async function previewBulkGenerateDrafts(
  clientId: string,
  periodStart: Date,
  periodEnd: Date
) {
  await requireAdmin();
  return validateBulkGenerateDrafts(clientId, periodStart, periodEnd);
}

export async function executeBulkGenerateDraftsAction(
  clientId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const user = await requireAdmin();
  const bulkOperationId = generateBulkOperationId();
  const result = await executeBulkGenerateDrafts(user, clientId, periodStart, periodEnd, bulkOperationId);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/clients");
  return result;
}

// --- Incidents ---

export async function previewBulkResolveIncidents(
  incidentIds: string[],
  resolutionNotes: string
) {
  const user = await requireAdmin();
  return validateBulkResolveIncidents(user, incidentIds, resolutionNotes);
}

export async function executeBulkResolveIncidentsAction(
  incidentIds: string[],
  resolutionNotes: string
) {
  const user = await requireAdmin();
  const bulkOperationId = generateBulkOperationId();
  const result = await executeBulkResolveIncidents(user, incidentIds, resolutionNotes, bulkOperationId);
  revalidatePath("/admin/incidents");
  return result;
}

// --- Work orders ---

export async function previewBulkWorkOrderTransition(
  workOrderIds: string[],
  toStatus: WorkOrderStatus
) {
  const user = await requireAdmin();
  return validateBulkWorkOrderTransition(user, workOrderIds, toStatus);
}

export async function executeBulkWorkOrderTransitionAction(
  workOrderIds: string[],
  toStatus: WorkOrderStatus
) {
  const user = await requireAdmin();
  const bulkOperationId = generateBulkOperationId();
  const result = await executeBulkWorkOrderTransition(user, workOrderIds, toStatus, bulkOperationId);
  revalidatePath("/admin/workorders");
  return result;
}

/** A3: Flag overdue COMPLETED_PENDING_APPROVAL jobs for reminder. Call from admin jobs page or cron. */
export async function runFlagOverdueApprovals() {
  const user = await requireAdmin();
  return flagOverdueApprovals(user.id);
}
