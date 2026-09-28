PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "visitId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'PROJECT',
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
    CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Payment" (
    "id",
    "projectId",
    "clientId",
    "source",
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
    'PROJECT',
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
CREATE UNIQUE INDEX "Payment_visitId_key" ON "Payment"("visitId");
CREATE INDEX "Payment_visitId_idx" ON "Payment"("visitId");
CREATE INDEX "Payment_source_idx" ON "Payment"("source");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_dueDate_idx" ON "Payment"("dueDate");

PRAGMA foreign_keys=ON;
