import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Use app's Prisma client (reads DATABASE_URL / TEST_DATABASE_URL from env)
export const testDb = prisma;

// Clean up database before each test (skip if DB unreachable, e.g. offline or no TEST_DATABASE_URL)
beforeEach(async () => {
  try {
    await testDb.auditLog.deleteMany();
    await testDb.evidence.deleteMany();
    await testDb.checklistRunItem.deleteMany();
    await testDb.checklistRun.deleteMany();
    await testDb.jobCompletion.deleteMany();
    await testDb.job.deleteMany();
    await testDb.workOrder.deleteMany();
    await testDb.invoiceLineItem.deleteMany();
    await testDb.billingAdjustment.deleteMany();
    await testDb.invoice.deleteMany();
    await testDb.payoutLine.deleteMany();
    await testDb.payoutBatch.deleteMany();
    await testDb.accessCredential.deleteMany();
    await testDb.siteAssignment.deleteMany();
    await testDb.complianceDocument.deleteMany();
    await testDb.worker.deleteMany();
    await testDb.user.deleteMany();
    await testDb.workforceAccount.deleteMany();
    await testDb.clientContact.deleteMany();
    await testDb.site.deleteMany();
    await testDb.clientOrganization.deleteMany();
    await testDb.lead.deleteMany();
    await testDb.incidentReport.deleteMany();
    await testDb.checklistTemplate.deleteMany();
    await testDb.contract.deleteMany();
    try {
      await testDb.siteTemplate.deleteMany();
      await testDb.jobTemplate.deleteMany();
      await testDb.contractTemplate.deleteMany();
      await testDb.invoiceTemplate.deleteMany();
      await testDb.makeGoodRuleTemplate.deleteMany();
    } catch {
      // Tables may not exist if migration not yet applied
    }
  } catch (e) {
    // DB unreachable (e.g. no network, no TEST_DATABASE_URL) - skip cleanup
  }
});

afterAll(async () => {
  await testDb.$disconnect();
});

// Test utilities
export async function createTestUser(overrides: {
  email: string;
  password?: string;
  role?: "ADMIN" | "CLIENT" | "VENDOR_OWNER" | "VENDOR_WORKER" | "INTERNAL_WORKER";
  workforceAccountId?: string;
  clientOrganizationId?: string;
  name?: string;
}) {
  const passwordHash = bcrypt.hashSync(overrides.password || "test123456", 10);

  return await testDb.user.create({
    data: {
      email: overrides.email,
      passwordHash,
      role: overrides.role || "INTERNAL_WORKER",
      name: overrides.name || "Test User",
      workforceAccountId: overrides.workforceAccountId,
      clientOrganizationId: overrides.clientOrganizationId,
    },
  });
}

export async function createTestWorkforceAccount(overrides: {
  type: "VENDOR" | "INTERNAL";
  displayName: string;
}) {
  return await testDb.workforceAccount.create({
    data: {
      type: overrides.type,
      displayName: overrides.displayName,
      primaryContactName: "Test Contact",
      primaryContactEmail: "test@example.com",
      primaryContactPhone: "555-0100",
    },
  });
}

export async function createTestClient() {
  return await testDb.clientOrganization.create({
    data: {
      name: "Test Client",
      primaryContactName: "Test Contact",
      primaryContactEmail: "client@example.com",
      primaryContactPhone: "555-0200",
    },
  });
}

export async function createTestSite(clientId: string) {
  return await testDb.site.create({
    data: {
      clientOrganizationId: clientId,
      name: "Test Site",
      address: "123 Test St",
      requiredPhotoCount: 4,
      suppliesProvidedBy: "COMPANY",
    },
  });
}

export async function createTestJob(overrides: {
  siteId: string;
  assignedWorkerId?: string;
  assignedWorkforceAccountId?: string;
  status?: "SCHEDULED" | "COMPLETED_PENDING_APPROVAL" | "APPROVED_PAYABLE" | "PAID" | "CANCELLED";
}) {
  return await testDb.job.create({
    data: {
      siteId: overrides.siteId,
      assignedWorkerId: overrides.assignedWorkerId,
      assignedWorkforceAccountId: overrides.assignedWorkforceAccountId,
      status: overrides.status || "SCHEDULED",
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      pricingModel: "Fixed",
      priceCents: 5000,
    },
  });
}
