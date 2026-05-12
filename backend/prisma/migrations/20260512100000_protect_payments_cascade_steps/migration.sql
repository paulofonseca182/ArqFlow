PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ProjectStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "startsAt" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectStep_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_ProjectStep" (
    "id",
    "projectId",
    "name",
    "description",
    "sortOrder",
    "startsAt",
    "dueDate",
    "completedAt",
    "status",
    "notes",
    "createdAt",
    "updatedAt"
) SELECT
    "id",
    "projectId",
    "name",
    "description",
    "sortOrder",
    "startsAt",
    "dueDate",
    "completedAt",
    "status",
    "notes",
    "createdAt",
    "updatedAt"
FROM "ProjectStep";

DROP TABLE "ProjectStep";
ALTER TABLE "new_ProjectStep" RENAME TO "ProjectStep";

CREATE INDEX "ProjectStep_projectId_idx" ON "ProjectStep"("projectId");
CREATE INDEX "ProjectStep_status_idx" ON "ProjectStep"("status");
CREATE UNIQUE INDEX "ProjectStep_projectId_sortOrder_key" ON "ProjectStep"("projectId", "sortOrder");

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

CREATE INDEX "Payment_projectId_idx" ON "Payment"("projectId");
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_dueDate_idx" ON "Payment"("dueDate");

PRAGMA foreign_keys=ON;
