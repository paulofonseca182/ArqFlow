PRAGMA foreign_keys=OFF;

ALTER TABLE "Client" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'NEW_CONTACT';

CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
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
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" (
    "id",
    "clientId",
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
    "pinned",
    "createdAt",
    "updatedAt"
) SELECT
    "id",
    "clientId",
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
    "pinned",
    "createdAt",
    "updatedAt"
FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
UPDATE "Project" SET "status" = 'CONTRACT_IN_PROGRESS' WHERE "status" = 'PLANNING';
UPDATE "Project" SET "status" = 'ANTEPROJECT_IN_DEVELOPMENT' WHERE "status" = 'IN_PROGRESS';

CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "installment" INTEGER,
    "dueDate" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVABLE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" (
    "id",
    "projectId",
    "clientId",
    "description",
    "amount",
    "paidAmount",
    "installment",
    "dueDate",
    "paidAt",
    "paymentMethod",
    "status",
    "notes",
    "createdAt",
    "updatedAt"
) SELECT
    "id",
    "projectId",
    "clientId",
    "description",
    "amount",
    "paidAmount",
    "installment",
    "dueDate",
    "paidAt",
    "paymentMethod",
    "status",
    "notes",
    "createdAt",
    "updatedAt"
FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
UPDATE "Payment" SET "status" = 'RECEIVABLE' WHERE "status" = 'PENDING';

CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "filePath" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_owner_check" CHECK ("clientId" IS NOT NULL OR "projectId" IS NOT NULL),
    CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" (
    "id",
    "clientId",
    "projectId",
    "name",
    "type",
    "filePath",
    "notes",
    "createdAt",
    "updatedAt"
) SELECT
    "id",
    "clientId",
    "projectId",
    "name",
    "type",
    "filePath",
    "notes",
    "createdAt",
    "updatedAt"
FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";

CREATE INDEX "Client_name_idx" ON "Client"("name");
CREATE INDEX "Client_status_idx" ON "Client"("status");
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_type_idx" ON "Project"("type");
CREATE INDEX "ProjectStep_projectId_idx" ON "ProjectStep"("projectId");
CREATE INDEX "ProjectStep_status_idx" ON "ProjectStep"("status");
CREATE INDEX "Budget_clientId_idx" ON "Budget"("clientId");
CREATE INDEX "Budget_projectId_idx" ON "Budget"("projectId");
CREATE INDEX "Budget_status_idx" ON "Budget"("status");
CREATE INDEX "BudgetItem_budgetId_idx" ON "BudgetItem"("budgetId");
CREATE INDEX "Payment_projectId_idx" ON "Payment"("projectId");
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_dueDate_idx" ON "Payment"("dueDate");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
CREATE INDEX "Visit_clientId_idx" ON "Visit"("clientId");
CREATE INDEX "Visit_projectId_idx" ON "Visit"("projectId");
CREATE INDEX "Visit_status_idx" ON "Visit"("status");
CREATE INDEX "Visit_date_idx" ON "Visit"("date");
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");
CREATE INDEX "Document_type_idx" ON "Document"("type");
CREATE INDEX "Briefing_clientId_idx" ON "Briefing"("clientId");
CREATE INDEX "Briefing_projectId_idx" ON "Briefing"("projectId");
CREATE INDEX "Briefing_type_idx" ON "Briefing"("type");
CREATE INDEX "BriefingAnswer_briefingId_idx" ON "BriefingAnswer"("briefingId");

PRAGMA foreign_keys=ON;
