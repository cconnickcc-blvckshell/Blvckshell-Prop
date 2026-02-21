/**
 * BLVCKSHELL Portal — Seed script
 * Creates: 1 admin, 1 vendor (2 workers), 1 internal (1 worker), 1 client portal user,
 * 3 client orgs, 3 sites, jobs, 1 missed + make-good, 1 work order, 1 incident.
 * Checklist item IDs from ops-binder/06_Checklists_Library/checklist-manifest.json
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const HASHED_PASSWORD = bcrypt.hashSync("password123", 10);

// CL_01 Lobby itemIds from manifest
const CL_01_ITEMS = [
  { itemId: "LOB-001", label: "Sweep and mop floor", required: true },
  { itemId: "LOB-002", label: "Clean glass doors and windows", required: true },
  { itemId: "LOB-003", label: "Wipe down reception desk/counter", required: true },
  { itemId: "LOB-004", label: "Dust all surfaces", required: true },
  { itemId: "LOB-005", label: "Empty and clean waste/recycling bins", required: true },
  { itemId: "LOB-006", label: "Vacuum or spot-clean carpets/rugs", required: true },
  { itemId: "LOB-007", label: "Clean light switches and door handles", required: true },
  { itemId: "LOB-008", label: "Check and replace light bulbs if burned out", required: false },
  { itemId: "LOB-009", label: "Wipe down elevator call buttons and panels", required: true },
  { itemId: "LOB-010", label: "Ensure lobby is free of odors", required: true },
];

// CL_02 Hallway itemIds from manifest
const CL_02_ITEMS = [
  { itemId: "HLY-001", label: "Sweep and mop hallway floor", required: true },
  { itemId: "HLY-002", label: "Dust baseboards and ledges", required: true },
  { itemId: "HLY-003", label: "Clean light fixtures", required: true },
  { itemId: "HLY-004", label: "Wipe door handles and frames", required: true },
  { itemId: "HLY-005", label: "Spot-clean walls", required: false },
  { itemId: "HLY-006", label: "Vacuum runners/mats", required: true },
  { itemId: "HLY-007", label: "Check emergency lighting", required: false },
  { itemId: "HLY-008", label: "Remove debris and clutter", required: true },
  { itemId: "HLY-009", label: "Final walk-through", required: true },
];

async function main() {
  console.log("Seeding database...");

  // 1. Admin user (no workforceAccountId)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@blvckshell.com" },
    update: {},
    create: {
      email: "admin@blvckshell.com",
      passwordHash: HASHED_PASSWORD,
      role: "ADMIN",
      name: "Admin User",
      phone: "+1 416 555 0001",
    },
  });
  console.log("Created admin:", adminUser.email);

  // 2. Vendor workforce + 2 users (1 VENDOR_OWNER, 1 VENDOR_WORKER) + 2 workers
  const vendorAccount = await prisma.workforceAccount.upsert({
    where: { id: "seed-vendor-account" },
    update: {},
    create: {
      id: "seed-vendor-account",
      type: "VENDOR",
      displayName: "CleanPro Subcontractors",
      legalName: "CleanPro Subcontractors Inc.",
      primaryContactName: "Jane Vendor",
      primaryContactEmail: "jane@cleanpro.example.com",
      primaryContactPhone: "+1 416 555 1000",
      hstNumber: "123456789 RT0001",
      wsibAccountNumber: "WSIB-001",
    },
  });

  const vendorOwnerUser = await prisma.user.upsert({
    where: { email: "jane@cleanpro.example.com" },
    update: {},
    create: {
      email: "jane@cleanpro.example.com",
      passwordHash: HASHED_PASSWORD,
      role: "VENDOR_OWNER",
      workforceAccountId: vendorAccount.id,
      name: "Jane Vendor",
      phone: "+1 416 555 1000",
    },
  });

  const vendorWorkerUser = await prisma.user.upsert({
    where: { email: "bob@cleanpro.example.com" },
    update: {},
    create: {
      email: "bob@cleanpro.example.com",
      passwordHash: HASHED_PASSWORD,
      role: "VENDOR_WORKER",
      workforceAccountId: vendorAccount.id,
      name: "Bob Worker",
      phone: "+1 416 555 1001",
    },
  });

  const vendorWorker1 = await prisma.worker.upsert({
    where: { userId: vendorWorkerUser.id },
    update: {},
    create: {
      userId: vendorWorkerUser.id,
      workforceAccountId: vendorAccount.id,
    },
  });
  // VENDOR_OWNER doesn't need a Worker record for portal job assignment; workers do.

  // 3. Internal workforce + 1 worker
  const internalAccount = await prisma.workforceAccount.upsert({
    where: { id: "seed-internal-account" },
    update: {},
    create: {
      id: "seed-internal-account",
      type: "INTERNAL",
      displayName: "BLVCKSHELL Internal",
      primaryContactName: "Internal Ops",
      primaryContactEmail: "internal@blvckshell.com",
      primaryContactPhone: "+1 416 555 2000",
    },
  });

  const internalWorkerUser = await prisma.user.upsert({
    where: { email: "mike@blvckshell.com" },
    update: {},
    create: {
      email: "mike@blvckshell.com",
      passwordHash: HASHED_PASSWORD,
      role: "INTERNAL_WORKER",
      workforceAccountId: internalAccount.id,
      name: "Mike Internal",
      phone: "+1 416 555 2001",
    },
  });

  const internalWorker = await prisma.worker.upsert({
    where: { userId: internalWorkerUser.id },
    update: {},
    create: {
      userId: internalWorkerUser.id,
      workforceAccountId: internalAccount.id,
    },
  });

  // 4. Client orgs + sites
  const client1 = await prisma.clientOrganization.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      name: "Maple Condos Inc.",
      primaryContactName: "Sarah PM",
      primaryContactEmail: "sarah@maplecondos.com",
      primaryContactPhone: "+1 416 555 3000",
      notes: "Main building 100 units",
    },
  });

  const client2 = await prisma.clientOrganization.upsert({
    where: { id: "seed-client-2" },
    update: {},
    create: {
      id: "seed-client-2",
      name: "Downtown Property Group",
      primaryContactName: "Tom Manager",
      primaryContactEmail: "tom@downtownpg.com",
      primaryContactPhone: "+1 416 555 3001",
    },
  });

  const client3 = await prisma.clientOrganization.upsert({
    where: { id: "seed-client-3" },
    update: {},
    create: {
      id: "seed-client-3",
      name: "Riverside Commercial Ltd.",
      primaryContactName: "Alex Facilities",
      primaryContactEmail: "alex@riversidecommercial.com",
      primaryContactPhone: "+1 416 555 3002",
      notes: "Multi-site portfolio",
    },
  });

  // Client portal user (read-only: sites, jobs, evidence, invoices for their org)
  const clientPortalUser = await prisma.user.upsert({
    where: { email: "sarah@maplecondos.com" },
    update: {},
    create: {
      email: "sarah@maplecondos.com",
      passwordHash: HASHED_PASSWORD,
      role: "CLIENT",
      clientOrganizationId: client1.id,
      name: "Sarah PM",
      phone: "+1 416 555 3000",
    },
  });
  console.log("Created client portal user:", clientPortalUser.email);

  const site1 = await prisma.site.upsert({
    where: { id: "seed-site-1" },
    update: {},
    create: {
      id: "seed-site-1",
      clientOrganizationId: client1.id,
      name: "Maple Tower Lobby",
      address: "100 Maple Street, Toronto ON",
      accessInstructions: "Use main entrance; concierge has key.",
      serviceWindow: "6:00–10:00",
      estimatedDurationMinutes: 45,
      requiredPhotoCount: 4,
      suppliesProvidedBy: "COMPANY",
      doNotEnterUnits: true,
    },
  });

  const site2 = await prisma.site.upsert({
    where: { id: "seed-site-2" },
    update: {},
    create: {
      id: "seed-site-2",
      clientOrganizationId: client2.id,
      name: "Downtown Plaza Common Areas",
      address: "200 King St W, Toronto ON",
      accessInstructions: "Loading dock B; code at office.",
      serviceWindow: "5:00–9:00",
      estimatedDurationMinutes: 60,
      requiredPhotoCount: 4,
      suppliesProvidedBy: "MIXED",
      doNotEnterUnits: true,
    },
  });

  const site3 = await prisma.site.upsert({
    where: { id: "seed-site-3" },
    update: {},
    create: {
      id: "seed-site-3",
      clientOrganizationId: client3.id,
      name: "Riverside Tower A",
      address: "300 Riverside Dr, Toronto ON",
      accessInstructions: "Security desk; sign in required.",
      serviceWindow: "6:00–11:00",
      estimatedDurationMinutes: 90,
      requiredPhotoCount: 6,
      suppliesProvidedBy: "COMPANY",
      doNotEnterUnits: true,
    },
  });

  // 5. Checklist templates (one active per site; use CL_01 and CL_02 item IDs)
  const template1Exists = await prisma.checklistTemplate.findFirst({
    where: { siteId: site1.id, isActive: true },
  });
  if (!template1Exists) {
    await prisma.checklistTemplate.create({
      data: {
        siteId: site1.id,
        version: 1,
        isActive: true,
        items: CL_01_ITEMS,
      },
    });
  }

  const template2Exists = await prisma.checklistTemplate.findFirst({
    where: { siteId: site2.id, isActive: true },
  });
  if (!template2Exists) {
    await prisma.checklistTemplate.create({
      data: {
        siteId: site2.id,
        version: 1,
        isActive: true,
        items: CL_02_ITEMS,
      },
    });
  }

  const template3Exists = await prisma.checklistTemplate.findFirst({
    where: { siteId: site3.id, isActive: true },
  });
  if (!template3Exists) {
    await prisma.checklistTemplate.create({
      data: {
        siteId: site3.id,
        version: 1,
        isActive: true,
        items: CL_01_ITEMS,
      },
    });
  }

  // 6. Jobs (assign to workers; exactly one of assignedWorkforceAccountId or assignedWorkerId per DB constraint)
  const baseDate = new Date();
  baseDate.setHours(8, 0, 0, 0);

  const job1 = await prisma.job.create({
    data: {
      siteId: site1.id,
      scheduledStart: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      status: "SCHEDULED",
      payoutAmountCents: 8500,
      assignedWorkerId: vendorWorker1.id,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      siteId: site1.id,
      scheduledStart: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      scheduledEnd: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      status: "SCHEDULED",
      payoutAmountCents: 7500,
      assignedWorkerId: internalWorker.id,
    },
  });

  const job3 = await prisma.job.create({
    data: {
      siteId: site2.id,
      scheduledStart: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: "SCHEDULED",
      payoutAmountCents: 12000,
      assignedWorkerId: vendorWorker1.id,
    },
  });

  const job4 = await prisma.job.create({
    data: {
      siteId: site2.id,
      scheduledStart: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: "APPROVED_PAYABLE",
      payoutAmountCents: 10000,
      assignedWorkerId: vendorWorker1.id,
    },
  });

  const job5 = await prisma.job.create({
    data: {
      siteId: site1.id,
      scheduledStart: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: "COMPLETED_PENDING_APPROVAL",
      payoutAmountCents: 8500,
      assignedWorkerId: internalWorker.id,
    },
  });

  // Missed job + make-good
  const missedJob = await prisma.job.create({
    data: {
      siteId: site1.id,
      scheduledStart: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: "CANCELLED",
      payoutAmountCents: 0,
      assignedWorkerId: vendorWorker1.id,
      isMissed: true,
      missedReason: "Worker no-show; make-good scheduled.",
    },
  });

  await prisma.job.create({
    data: {
      siteId: site1.id,
      scheduledStart: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
      status: "SCHEDULED",
      payoutAmountCents: 8500,
      assignedWorkerId: vendorWorker1.id,
      makeGoodJobId: missedJob.id,
    },
  });

  // One more job (6 total regular + missed + make-good)
  await prisma.job.create({
    data: {
      siteId: site2.id,
      scheduledStart: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: "SCHEDULED",
      payoutAmountCents: 11000,
      assignedWorkerId: internalWorker.id,
    },
  });

  // 7. Work order
  await prisma.workOrder.create({
    data: {
      siteId: site1.id,
      requestedBy: "Sarah PM",
      description: "Extra hallway deep clean after renovation",
      priceCents: 25000,
      status: "REQUESTED",
      assignedWorkforceAccountId: vendorAccount.id,
    },
  });

  // 8. Incident report
  await prisma.incidentReport.create({
    data: {
      siteId: site1.id,
      workerId: vendorWorker1.id,
      type: "PROPERTY_DAMAGE",
      description: "Minor scuff on lobby wall during equipment move. Noted for touch-up.",
      reportedAt: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seed complete.");
  console.log("  Admin: admin@blvckshell.com / password123");
  console.log("  Vendor owner: jane@cleanpro.example.com / password123");
  console.log("  Vendor worker: bob@cleanpro.example.com / password123");
  console.log("  Internal worker: mike@blvckshell.com / password123");
  console.log("  Client portal: sarah@maplecondos.com / password123 → /client");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
