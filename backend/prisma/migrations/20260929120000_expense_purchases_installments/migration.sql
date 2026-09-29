PRAGMA foreign_keys=OFF;

CREATE TABLE "Expense_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentExpenseId" TEXT,
    "projectId" TEXT,
    "clientId" TEXT,
    "categoryId" TEXT,
    "cashAccountId" TEXT,
    "entryType" TEXT NOT NULL DEFAULT 'SINGLE',
    "classification" TEXT NOT NULL DEFAULT 'OPERATIONAL_EXPENSE',
    "description" TEXT NOT NULL,
    "supplier" TEXT,
    "costCenter" TEXT,
    "amount" DECIMAL NOT NULL,
    "dueDate" DATETIME,
    "purchaseDate" DATETIME,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "installmentNumber" INTEGER,
    "installmentCount" INTEGER,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_parentExpenseId_fkey" FOREIGN KEY ("parentExpenseId") REFERENCES "Expense" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "Expense_new" (
    "id",
    "projectId",
    "clientId",
    "categoryId",
    "cashAccountId",
    "entryType",
    "classification",
    "description",
    "supplier",
    "costCenter",
    "amount",
    "dueDate",
    "purchaseDate",
    "paidAmount",
    "paidAt",
    "paymentMethod",
    "status",
    "installmentNumber",
    "installmentCount",
    "recurring",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "projectId",
    "clientId",
    "categoryId",
    "cashAccountId",
    'SINGLE',
    'OPERATIONAL_EXPENSE',
    "description",
    "supplier",
    "costCenter",
    "amount",
    "dueDate",
    "createdAt",
    CASE WHEN "status" = 'PAID' THEN "amount" ELSE 0 END,
    "paidAt",
    "paymentMethod",
    "status",
    1,
    1,
    "recurring",
    "notes",
    "createdAt",
    "updatedAt"
FROM "Expense";

DROP TABLE "Expense";
ALTER TABLE "Expense_new" RENAME TO "Expense";

CREATE INDEX "Expense_parentExpenseId_idx" ON "Expense"("parentExpenseId");
CREATE INDEX "Expense_projectId_idx" ON "Expense"("projectId");
CREATE INDEX "Expense_clientId_idx" ON "Expense"("clientId");
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");
CREATE INDEX "Expense_cashAccountId_idx" ON "Expense"("cashAccountId");
CREATE INDEX "Expense_entryType_idx" ON "Expense"("entryType");
CREATE INDEX "Expense_classification_idx" ON "Expense"("classification");
CREATE INDEX "Expense_status_idx" ON "Expense"("status");
CREATE INDEX "Expense_dueDate_idx" ON "Expense"("dueDate");

CREATE TABLE "ExpensePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "cashAccountId" TEXT,
    "amount" DECIMAL NOT NULL,
    "paidAt" DATETIME NOT NULL,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExpensePayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExpensePayment_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ExpensePayment_expenseId_idx" ON "ExpensePayment"("expenseId");
CREATE INDEX "ExpensePayment_cashAccountId_idx" ON "ExpensePayment"("cashAccountId");
CREATE INDEX "ExpensePayment_paidAt_idx" ON "ExpensePayment"("paidAt");

CREATE TABLE "CashMovement_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT,
    "expenseId" TEXT,
    "expensePaymentId" TEXT,
    "visitId" TEXT,
    "clientId" TEXT,
    "projectId" TEXT,
    "categoryId" TEXT,
    "cashAccountId" TEXT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentMethod" TEXT,
    "origin" TEXT NOT NULL,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CashMovement_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_expensePaymentId_fkey" FOREIGN KEY ("expensePaymentId") REFERENCES "ExpensePayment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "CashMovement_new" (
    "id",
    "paymentId",
    "expenseId",
    "expensePaymentId",
    "visitId",
    "clientId",
    "projectId",
    "categoryId",
    "cashAccountId",
    "type",
    "date",
    "description",
    "amount",
    "paymentMethod",
    "origin",
    "referenceId",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "paymentId",
    "expenseId",
    CASE WHEN "expenseId" IS NOT NULL AND "origin" = 'EXPENSE_PAYMENT' THEN 'expay_' || "id" ELSE NULL END,
    "visitId",
    "clientId",
    "projectId",
    "categoryId",
    "cashAccountId",
    "type",
    "date",
    "description",
    "amount",
    "paymentMethod",
    "origin",
    "referenceId",
    "notes",
    "createdAt",
    "updatedAt"
FROM "CashMovement";

DROP TABLE "CashMovement";
ALTER TABLE "CashMovement_new" RENAME TO "CashMovement";

INSERT INTO "ExpensePayment" (
    "id",
    "expenseId",
    "cashAccountId",
    "amount",
    "paidAt",
    "paymentMethod",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    'expay_' || "id",
    "expenseId",
    "cashAccountId",
    "amount",
    "date",
    "paymentMethod",
    "notes",
    "createdAt",
    "updatedAt"
FROM "CashMovement"
WHERE "expenseId" IS NOT NULL AND "origin" = 'EXPENSE_PAYMENT';

CREATE UNIQUE INDEX "CashMovement_paymentId_key" ON "CashMovement"("paymentId");
CREATE UNIQUE INDEX "CashMovement_expensePaymentId_key" ON "CashMovement"("expensePaymentId");
CREATE INDEX "CashMovement_type_idx" ON "CashMovement"("type");
CREATE INDEX "CashMovement_date_idx" ON "CashMovement"("date");
CREATE INDEX "CashMovement_origin_idx" ON "CashMovement"("origin");
CREATE INDEX "CashMovement_referenceId_idx" ON "CashMovement"("referenceId");
CREATE INDEX "CashMovement_clientId_idx" ON "CashMovement"("clientId");
CREATE INDEX "CashMovement_projectId_idx" ON "CashMovement"("projectId");
CREATE INDEX "CashMovement_categoryId_idx" ON "CashMovement"("categoryId");
CREATE INDEX "CashMovement_cashAccountId_idx" ON "CashMovement"("cashAccountId");
CREATE INDEX "CashMovement_expenseId_idx" ON "CashMovement"("expenseId");

PRAGMA foreign_keys=ON;
