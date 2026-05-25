PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "budgetId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "workAddress" TEXT,
    "area" DECIMAL,
    "contractedAmount" DECIMAL,
    "startsAt" DATETIME,
    "expectedDeliveryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'CONTRACT_IN_PROGRESS',
    "description" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'LEGACY',
    "manualReason" TEXT,
    "approvedAt" DATETIME,
    "convertedAt" DATETIME,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Project" (
    "id",
    "clientId",
    "budgetId",
    "name",
    "type",
    "workAddress",
    "area",
    "contractedAmount",
    "startsAt",
    "expectedDeliveryDate",
    "status",
    "description",
    "notes",
    "internalNotes",
    "origin",
    "manualReason",
    "approvedAt",
    "convertedAt",
    "pinned",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "clientId",
    "budgetId",
    "name",
    "type",
    "workAddress",
    "area",
    "contractedAmount",
    "startsAt",
    "expectedDeliveryDate",
    "status",
    "description",
    "notes",
    "internalNotes",
    CASE
        WHEN "origin" = 'BUDGET_APPROVAL' THEN 'BUDGET_APPROVAL'
        WHEN "origin" = 'INTERNAL' OR "manualReason" = 'INTERNAL_PROJECT' THEN 'INTERNAL'
        ELSE 'LEGACY'
    END,
    CASE
        WHEN "origin" = 'BUDGET_APPROVAL' THEN NULL
        WHEN "origin" = 'INTERNAL' OR "manualReason" = 'INTERNAL_PROJECT' THEN 'INTERNAL_PROJECT'
        ELSE 'LEGACY_PROJECT'
    END,
    "approvedAt",
    "convertedAt",
    "pinned",
    "createdAt",
    "updatedAt"
FROM "Project";

DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";

CREATE UNIQUE INDEX "Project_budgetId_key" ON "Project"("budgetId");
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX "Project_budgetId_idx" ON "Project"("budgetId");
CREATE INDEX "Project_origin_idx" ON "Project"("origin");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_type_idx" ON "Project"("type");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
