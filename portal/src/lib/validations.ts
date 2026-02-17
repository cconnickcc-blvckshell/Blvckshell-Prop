import { z } from "zod";

// ============================================================================
// Auth Validations
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// Job Validations
// ============================================================================

export const jobCompletionSchema = z.object({
  jobId: z.string().cuid(),
  checklistResults: z.record(
    z.string(), // itemId
    z.object({
      result: z.enum(["PASS", "FAIL", "NA"]),
      note: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
});

export type JobCompletionInput = z.infer<typeof jobCompletionSchema>;

// ============================================================================
// File Upload Validations
// ============================================================================

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  jobId: z.string().cuid(),
  completionId: z.string().cuid(),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;

// ============================================================================
// Workforce Validations
// ============================================================================

export const createWorkforceAccountSchema = z.object({
  type: z.enum(["INTERNAL", "VENDOR"]),
  displayName: z.string().min(1, "Display name is required"),
  legalName: z.string().optional(),
  primaryContactName: z.string().min(1, "Contact name is required"),
  primaryContactEmail: z.string().email("Invalid email address"),
  primaryContactPhone: z.string().min(1, "Phone is required"),
  hstNumber: z.string().optional(),
  wsibAccountNumber: z.string().optional(),
});

export type CreateWorkforceAccountInput = z.infer<typeof createWorkforceAccountSchema>;

// ============================================================================
// Site Validations
// ============================================================================

export const createSiteSchema = z.object({
  clientOrganizationId: z.string().cuid(),
  name: z.string().min(1, "Site name is required"),
  address: z.string().min(1, "Address is required"),
  accessInstructions: z.string().optional(),
  serviceWindow: z.string().optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  requiredPhotoCount: z.number().int().positive().default(4),
  suppliesProvidedBy: z.enum(["COMPANY", "CLIENT", "MIXED"]),
  doNotEnterUnits: z.boolean().default(true),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;

// ============================================================================
// Job Validations
// ============================================================================

export const createJobSchema = z.object({
  siteId: z.string().cuid(),
  scheduledStart: z.date(),
  scheduledEnd: z.date().optional(),
  payoutAmountCents: z.number().int().positive(),
  assignedWorkforceAccountId: z.string().cuid().optional(),
  assignedWorkerId: z.string().cuid().optional(),
}).refine(
  (data) => {
    // Exactly one of assignedWorkforceAccountId or assignedWorkerId must be set
    return (
      (data.assignedWorkforceAccountId !== undefined && data.assignedWorkerId === undefined) ||
      (data.assignedWorkforceAccountId === undefined && data.assignedWorkerId !== undefined)
    );
  },
  {
    message: "Exactly one of assignedWorkforceAccountId or assignedWorkerId must be set",
  }
);

export type CreateJobInput = z.infer<typeof createJobSchema>;
