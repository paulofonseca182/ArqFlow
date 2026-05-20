UPDATE "Budget"
SET
  "approvedAt" = COALESCE("approvedAt", "updatedAt"),
  "convertedAt" = COALESCE("convertedAt", "updatedAt"),
  "convertedProjectId" = "projectId"
WHERE
  "status" = 'APPROVED'
  AND "projectId" IS NOT NULL
  AND "convertedProjectId" IS NULL
  AND (
    SELECT COUNT(*)
    FROM "Budget" AS "otherBudget"
    WHERE
      "otherBudget"."projectId" = "Budget"."projectId"
      AND "otherBudget"."status" = 'APPROVED'
  ) = 1;

UPDATE "Project"
SET
  "budgetId" = (
    SELECT "Budget"."id"
    FROM "Budget"
    WHERE "Budget"."convertedProjectId" = "Project"."id"
    LIMIT 1
  ),
  "origin" = 'BUDGET_APPROVAL',
  "approvedAt" = (
    SELECT "Budget"."approvedAt"
    FROM "Budget"
    WHERE "Budget"."convertedProjectId" = "Project"."id"
    LIMIT 1
  ),
  "convertedAt" = (
    SELECT "Budget"."convertedAt"
    FROM "Budget"
    WHERE "Budget"."convertedProjectId" = "Project"."id"
    LIMIT 1
  )
WHERE
  "budgetId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "Budget"
    WHERE "Budget"."convertedProjectId" = "Project"."id"
  );

UPDATE "Project"
SET
  "origin" = 'LEGACY',
  "manualReason" = 'LEGACY_PROJECT'
WHERE
  "budgetId" IS NULL
  AND "origin" = 'MANUAL'
  AND "manualReason" IS NULL;
