import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using service role
// Per DECISIONS.md §3.3 #16: Server-only with service role; no client direct access

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const storage = supabase.storage;

// Evidence bucket
export const EVIDENCE_BUCKET = "evidence";

// Compliance bucket
export const COMPLIANCE_BUCKET = "compliance";

// Max photo size: 10MB
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

// Allowed file types
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Max photos per job: 20 (per DECISIONS.md §3.4 #19)
export const MAX_PHOTOS_PER_JOB = 20;

/**
 * Generate evidence storage path
 * Pattern: evidence/{jobId}/{completionId}/{timestamp}-{uuid}.{ext}
 */
export function generateEvidencePath(
  jobId: string,
  completionId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  return `${EVIDENCE_BUCKET}/${jobId}/${completionId}/${timestamp}-${uuid}.${ext}`;
}

/**
 * Generate compliance document storage path
 * Pattern: compliance/{workforceAccountId}/{type}/{timestamp}-{uuid}.{ext}
 */
export function generateCompliancePath(
  workforceAccountId: string,
  type: string,
  filename: string
): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const ext = filename.split(".").pop()?.toLowerCase() || "pdf";
  return `${COMPLIANCE_BUCKET}/${workforceAccountId}/${type}/${timestamp}-${uuid}.${ext}`;
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size <= MAX_PHOTO_SIZE;
}
