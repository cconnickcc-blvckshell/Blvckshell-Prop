-- Gold Standard: Redaction as user-declared attestation (explicit, auditable).

ALTER TABLE "Evidence"
  ADD COLUMN IF NOT EXISTS "redactionAttestedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "redactionAttestedByUserId" TEXT;
