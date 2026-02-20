import { testDb } from "../setup";
import * as bcrypt from "bcryptjs";

/**
 * Create a complete test scenario with user, workforce, client, site, and job
 */
export async function createCompleteTestScenario() {
  // Create workforce account
  const workforce = await testDb.workforceAccount.create({
    data: {
      type: "INTERNAL",
      displayName: "Test Workforce",
      primaryContactName: "Test Contact",
      primaryContactEmail: "workforce@test.com",
      primaryContactPhone: "555-0100",
    },
  });

  // Create worker user
  const workerUser = await testDb.user.create({
    data: {
      email: "worker@test.com",
      passwordHash: bcrypt.hashSync("test123456", 10),
      role: "INTERNAL_WORKER",
      name: "Test Worker",
      workforceAccountId: workforce.id,
    },
  });

  const worker = await testDb.worker.create({
    data: {
      userId: workerUser.id,
      workforceAccountId: workforce.id,
    },
  });

  // Create admin user
  const adminUser = await testDb.user.create({
    data: {
      email: "admin@test.com",
      passwordHash: bcrypt.hashSync("test123456", 10),
      role: "ADMIN",
      name: "Test Admin",
    },
  });

  // Create client and site
  const client = await testDb.clientOrganization.create({
    data: {
      name: "Test Client",
      primaryContactName: "Client Contact",
      primaryContactEmail: "client@test.com",
      primaryContactPhone: "555-0200",
    },
  });

  const site = await testDb.site.create({
    data: {
      clientOrganizationId: client.id,
      name: "Test Site",
      address: "123 Test St",
      requiredPhotoCount: 4,
      suppliesProvidedBy: "COMPANY",
    },
  });

  // Create job
  const job = await testDb.job.create({
    data: {
      siteId: site.id,
      assignedWorkerId: worker.id,
      status: "SCHEDULED",
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      pricingModel: "Fixed",
      priceCents: 5000,
    },
  });

  return {
    workforce,
    workerUser,
    worker,
    adminUser,
    client,
    site,
    job,
  };
}

/**
 * Get auth headers for a user
 */
export function getAuthHeaders(sessionToken?: string) {
  return {
    Cookie: sessionToken ? `next-auth.session-token=${sessionToken}` : "",
  };
}

/**
 * Create a mock file for testing uploads
 */
export function createMockFile(
  name: string = "test.jpg",
  size: number = 1024 * 1024, // 1MB
  type: string = "image/jpeg"
): File {
  const blob = new Blob(["mock file content"], { type });
  return new File([blob], name, { type });
}

/**
 * Wait for async operations
 */
export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
