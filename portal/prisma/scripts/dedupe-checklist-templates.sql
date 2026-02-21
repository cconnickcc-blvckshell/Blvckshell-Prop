-- De-duplicate ChecklistTemplate: keep one row per siteId (earliest id), delete the rest.
-- Run: npx prisma db execute --file prisma/scripts/dedupe-checklist-templates.sql
DELETE FROM "ChecklistTemplate" a
USING "ChecklistTemplate" b
WHERE a."siteId" = b."siteId" AND a.id > b.id;
