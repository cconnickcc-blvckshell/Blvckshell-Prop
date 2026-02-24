import { prisma } from "@/lib/prisma";

export interface ComplianceCheckResult {
  compliant: boolean;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  code: string;
  message: string;
  severity: "BLOCKING" | "WARNING";
}

/**
 * Check if a workforce account meets all compliance requirements.
 * Returns blocking issues that prevent job assignment / payout.
 */
export async function checkWorkforceCompliance(
  workforceAccountId: string
): Promise<ComplianceCheckResult> {
  const account = await prisma.workforceAccount.findUnique({
    where: { id: workforceAccountId },
    select: {
      type: true,
      classification: true,
      complianceSuspended: true,
      isActive: true,
      hstNumber: true,
      wsibAccountNumber: true,
      complianceDocuments: {
        select: { type: true, expiresAt: true },
      },
    },
  });

  if (!account) {
    return {
      compliant: false,
      issues: [{ code: "NOT_FOUND", message: "Workforce account not found", severity: "BLOCKING" }],
    };
  }

  const issues: ComplianceIssue[] = [];
  const now = new Date();

  if (!account.isActive) {
    issues.push({ code: "INACTIVE", message: "Workforce account is inactive", severity: "BLOCKING" });
  }

  if (account.complianceSuspended) {
    issues.push({ code: "SUSPENDED", message: "Workforce account is compliance-suspended", severity: "BLOCKING" });
  }

  // Vendor-specific compliance: COI and WSIB required
  if (account.type === "VENDOR") {
    const coiDoc = account.complianceDocuments.find((d) => d.type === "COI");
    if (!coiDoc) {
      issues.push({ code: "MISSING_COI", message: "Certificate of Insurance (COI) not on file", severity: "BLOCKING" });
    } else if (coiDoc.expiresAt && coiDoc.expiresAt < now) {
      issues.push({ code: "EXPIRED_COI", message: "Certificate of Insurance (COI) has expired", severity: "BLOCKING" });
    }

    const wsibDoc = account.complianceDocuments.find((d) => d.type === "WSIB");
    if (!wsibDoc) {
      issues.push({ code: "MISSING_WSIB", message: "WSIB clearance certificate not on file", severity: "BLOCKING" });
    } else if (wsibDoc.expiresAt && wsibDoc.expiresAt < now) {
      issues.push({ code: "EXPIRED_WSIB", message: "WSIB clearance certificate has expired", severity: "BLOCKING" });
    }

    // Warn if HST number is missing (not blocking, but needed for invoicing)
    if (!account.hstNumber) {
      issues.push({ code: "MISSING_HST", message: "HST/GST number not on file", severity: "WARNING" });
    }
  }

  const blockingIssues = issues.filter((i) => i.severity === "BLOCKING");
  return {
    compliant: blockingIssues.length === 0,
    issues,
  };
}

/**
 * Pre-flight check for job assignment: verifies the target workforce account
 * or worker's account is compliant.
 */
export async function canAssignJob(input: {
  workforceAccountId?: string;
  workerId?: string;
}): Promise<ComplianceCheckResult> {
  let accountId = input.workforceAccountId;

  if (!accountId && input.workerId) {
    const worker = await prisma.worker.findUnique({
      where: { id: input.workerId },
      select: { workforceAccountId: true },
    });
    accountId = worker?.workforceAccountId;
  }

  if (!accountId) {
    return {
      compliant: false,
      issues: [{ code: "NO_ACCOUNT", message: "No workforce account found", severity: "BLOCKING" }],
    };
  }

  return checkWorkforceCompliance(accountId);
}
