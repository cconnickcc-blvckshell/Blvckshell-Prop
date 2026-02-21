import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  workforceAccountId?: string;
  workerId?: string;
  clientOrganizationId?: string;
}

/**
 * Get current session user
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    role: session.user.role,
    workforceAccountId: session.user.workforceAccountId,
    workerId: session.user.workerId,
    clientOrganizationId: session.user.clientOrganizationId,
  };
}

/**
 * Require authentication
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

/**
 * Require client portal role (read-only access to their organization's data).
 */
export async function requireClient(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "CLIENT" || !user.clientOrganizationId) {
    throw new Error("Forbidden: Client access required");
  }
  return user;
}

/**
 * Require vendor owner role
 */
export async function requireVendorOwner(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "VENDOR_OWNER") {
    throw new Error("Forbidden: Vendor owner access required");
  }
  return user;
}

/**
 * Require worker portal access (VENDOR_WORKER, INTERNAL_WORKER, or VENDOR_OWNER).
 * Matches (worker) layout so these roles can view /jobs, /profile, etc.
 */
export async function requireWorker(): Promise<SessionUser> {
  const user = await requireAuth();
  if (
    user.role !== "VENDOR_WORKER" &&
    user.role !== "INTERNAL_WORKER" &&
    user.role !== "VENDOR_OWNER"
  ) {
    throw new Error("Forbidden: Worker access required");
  }
  return user;
}

/**
 * Check if user can access job
 * - ADMIN: can access all jobs
 * - CLIENT: can access jobs for sites belonging to their clientOrganizationId
 * - VENDOR_OWNER: can access jobs assigned to their WorkforceAccount
 * - VENDOR_WORKER/INTERNAL_WORKER: can access jobs assigned to them
 */
export async function canAccessJob(user: SessionUser, jobId: string): Promise<boolean> {
  if (user.role === "ADMIN") {
    return true;
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      assignedWorkforceAccountId: true,
      assignedWorkerId: true,
      site: { select: { clientOrganizationId: true } },
    },
  });

  if (!job) {
    return false;
  }

  if (user.role === "CLIENT") {
    return job.site.clientOrganizationId === user.clientOrganizationId;
  }

  // VENDOR_OWNER: check if job assigned to their WorkforceAccount
  if (user.role === "VENDOR_OWNER") {
    return job.assignedWorkforceAccountId === user.workforceAccountId;
  }

  // VENDOR_WORKER/INTERNAL_WORKER: check if job assigned to them
  if (user.role === "VENDOR_WORKER" || user.role === "INTERNAL_WORKER") {
    // Per DECISIONS.md §3.3 #18: Job visible only when assignedWorkerId is set
    return job.assignedWorkerId === user.workerId;
  }

  return false;
}

/**
 * Check if user can access invoice (for client portal: invoice must belong to their org).
 * - ADMIN: can access all
 * - CLIENT: invoice.clientId must equal user.clientOrganizationId
 */
export async function canAccessInvoice(user: SessionUser, invoiceId: string): Promise<boolean> {
  if (user.role === "ADMIN") {
    return true;
  }
  if (user.role === "CLIENT" && user.clientOrganizationId) {
    const inv = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { clientId: true },
    });
    return inv != null ? inv.clientId === user.clientOrganizationId : false;
  }
  return false;
}

/**
 * Check if user can access WorkforceAccount
 * - ADMIN: can access all
 * - VENDOR_OWNER: can access only their own
 */
export async function canAccessWorkforceAccount(
  user: SessionUser,
  workforceAccountId: string
): Promise<boolean> {
  if (user.role === "ADMIN") {
    return true;
  }
  if (user.role === "VENDOR_OWNER") {
    return user.workforceAccountId === workforceAccountId;
  }
  return false;
}
