-- Backfill INTERNAL workforce accounts to employee payroll.
-- Updates only classification and allowedPaymentMethod.
-- Does not insert, delete, or rewrite any other column.
-- Rows whose display name starts with 'TEST Billy' are updated in place and must not be deleted.

UPDATE "WorkforceAccount"
SET
  "classification" = 'EMPLOYEE',
  "allowedPaymentMethod" = 'PAYROLL'
WHERE "type" = 'INTERNAL'
  AND (
    "classification" IS DISTINCT FROM 'EMPLOYEE'
    OR "allowedPaymentMethod" IS DISTINCT FROM 'PAYROLL'
  );
