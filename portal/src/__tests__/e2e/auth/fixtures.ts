import { config as loadEnv } from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { request as playwrightRequest, type APIRequestContext } from "@playwright/test";

loadEnv({ path: path.resolve(__dirname, "../../../../../.env") });

export const FIXTURE_PASSWORD = "Stage0-Test-1a";
export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
export const PRIVATE_JOB_ID = "stage0-private-job";

export const VIEWPORTS = [
  { name: "360x740", width: 360, height: 740 },
  { name: "390x844", width: 390, height: 844 },
  { name: "820x1180", width: 820, height: 1180 },
  { name: "1180x820", width: 1180, height: 820 },
] as const;

const ROLES = ["ADMIN", "FOUNDER", "CLIENT", "INTERNAL_WORKER", "VENDOR_WORKER", "VENDOR_OWNER"] as const;
export type Stage0Role = (typeof ROLES)[number];

export function roleEmail(role: Stage0Role): string {
  return `stage0-${role.toLowerCase().replace(/_/g, "-")}@example.com`;
}

let pool: Pool | null = null;
let db: PrismaClient | null = null;

function database(): PrismaClient {
  if (db) return db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  pool = new Pool({ connectionString, max: 2 });
  db = new PrismaClient({ adapter: new PrismaPg(pool) });
  return db;
}

async function upsertAccount(id: string, type: "INTERNAL" | "VENDOR", displayName: string) {
  const prisma = database();
  return prisma.workforceAccount.upsert({
    where: { id },
    update: { displayName, isActive: true, complianceSuspended: false },
    create: {
      id,
      type,
      displayName,
      primaryContactName: displayName,
      primaryContactEmail: `${id}@example.com`,
      primaryContactPhone: "555-0100",
    },
  });
}

async function upsertOrg(id: string, name: string) {
  const prisma = database();
  return prisma.clientOrganization.upsert({
    where: { id },
    update: { name },
    create: {
      id,
      name,
      primaryContactName: name,
      primaryContactEmail: `${id}@example.com`,
      primaryContactPhone: "555-0101",
    },
  });
}

export async function seedStage0Users(): Promise<void> {
  const prisma = database();
  const internal = await upsertAccount("stage0-internal-account", "INTERNAL", "Stage 0 Internal");
  const vendor = await upsertAccount("stage0-vendor-account", "VENDOR", "Stage 0 Vendor");
  const clientOrg = await upsertOrg("stage0-client-org", "Stage 0 Client");
  const otherOrg = await upsertOrg("stage0-other-org", "Stage 0 Other Client");

  await prisma.site.upsert({
    where: { id: "stage0-other-site" },
    update: { clientOrganizationId: otherOrg.id },
    create: {
      id: "stage0-other-site",
      clientOrganizationId: otherOrg.id,
      name: "Stage 0 Other Site",
      address: "1 Private St",
      requiredPhotoCount: 1,
      suppliesProvidedBy: "COMPANY",
    },
  });
  await prisma.job.upsert({
    where: { id: PRIVATE_JOB_ID },
    update: { siteId: "stage0-other-site" },
    create: {
      id: PRIVATE_JOB_ID,
      siteId: "stage0-other-site",
      status: "SCHEDULED",
      scheduledStart: new Date("2026-01-15T15:00:00.000Z"),
      scheduledEnd: new Date("2026-01-15T16:00:00.000Z"),
      payoutAmountCents: 1000,
    },
  });

  const passwordHash = bcrypt.hashSync(FIXTURE_PASSWORD, 10);
  for (const role of ROLES) {
    const workforceAccountId =
      role === "VENDOR_OWNER" || role === "VENDOR_WORKER"
        ? vendor.id
        : role === "INTERNAL_WORKER"
          ? internal.id
          : null;
    const clientOrganizationId = role === "CLIENT" ? clientOrg.id : null;
    const user = await prisma.user.upsert({
      where: { email: roleEmail(role) },
      update: {
        passwordHash,
        role,
        name: `Stage 0 ${role}`,
        isActive: true,
        workforceAccountId,
        clientOrganizationId,
      },
      create: {
        email: roleEmail(role),
        passwordHash,
        role,
        name: `Stage 0 ${role}`,
        workforceAccountId,
        clientOrganizationId,
      },
    });
    if (workforceAccountId) {
      await prisma.worker.upsert({
        where: { userId: user.id },
        update: { workforceAccountId, isActive: true },
        create: { userId: user.id, workforceAccountId },
      });
    }
  }
}

export async function closeStage0Database(): Promise<void> {
  await db?.$disconnect();
  await pool?.end();
  db = null;
  pool = null;
}

export async function loginRequest(role: Stage0Role, ip: string): Promise<APIRequestContext> {
  const context = await playwrightRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { "x-real-ip": ip },
  });
  const response = await context.post("/api/auth/login", {
    form: {
      email: roleEmail(role),
      password: FIXTURE_PASSWORD,
      callbackUrl: "/portal",
    },
    maxRedirects: 0,
  });
  if (response.status() !== 303) {
    throw new Error(`Login for ${role} returned ${response.status()} ${response.headers().location ?? ""}`);
  }
  const location = response.headers().location ?? "";
  if (location.toLowerCase().includes("password") || location.includes(FIXTURE_PASSWORD)) {
    throw new Error(`Login redirect for ${role} echoed a credential`);
  }
  return context;
}
