PRAGMA foreign_keys=OFF;

CREATE TABLE "FinancialCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "costCenter" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "FinancialCategory_name_type_key" ON "FinancialCategory"("name", "type");
CREATE INDEX "FinancialCategory_type_idx" ON "FinancialCategory"("type");
CREATE INDEX "FinancialCategory_active_idx" ON "FinancialCategory"("active");

INSERT INTO "FinancialCategory" ("id", "name", "type", "costCenter", "active", "createdAt", "updatedAt") VALUES
('cat-revenue-project-architecture', 'Projeto de arquitetura', 'REVENUE', 'Projeto', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-revenue-technical-visit', 'Visita técnica', 'REVENUE', 'Comercial', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-revenue-consulting', 'Consultoria', 'REVENUE', 'Comercial', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-revenue-adjustment', 'Ajuste de receita', 'REVENUE', 'Financeiro', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-revenue-other', 'Outros', 'REVENUE', 'Financeiro', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-rent', 'Aluguel', 'EXPENSE', 'Administrativo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-energy', 'Energia', 'EXPENSE', 'Administrativo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-internet', 'Internet', 'EXPENSE', 'Administrativo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-software', 'Software', 'EXPENSE', 'Operacional', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-taxes', 'Impostos', 'EXPENSE', 'Financeiro', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-accounting', 'Contabilidade', 'EXPENSE', 'Administrativo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-marketing', 'Marketing', 'EXPENSE', 'Marketing', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-transport', 'Transporte', 'EXPENSE', 'Operacional', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-freelancer', 'Freelancer', 'EXPENSE', 'Projeto', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-material', 'Material', 'EXPENSE', 'Projeto', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-bank-fees', 'Taxas bancárias', 'EXPENSE', 'Financeiro', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-equipment', 'Equipamentos', 'EXPENSE', 'Operacional', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-expense-other', 'Outros', 'EXPENSE', 'Administrativo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "CashAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CASH',
    "openingBalance" DECIMAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "CashAccount_name_key" ON "CashAccount"("name");
CREATE INDEX "CashAccount_type_idx" ON "CashAccount"("type");
CREATE INDEX "CashAccount_active_idx" ON "CashAccount"("active");

INSERT INTO "CashAccount" ("id", "name", "type", "openingBalance", "active", "createdAt", "updatedAt")
VALUES ('acc-main-cash', 'Caixa principal', 'CASH', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "visitId" TEXT,
    "categoryId" TEXT,
    "cashAccountId" TEXT,
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
    CONSTRAINT "Payment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Payment" (
    "id",
    "projectId",
    "clientId",
    "visitId",
    "categoryId",
    "cashAccountId",
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
    "visitId",
    CASE WHEN "source" = 'VISIT' THEN 'cat-revenue-technical-visit' ELSE 'cat-revenue-project-architecture' END,
    'acc-main-cash',
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
FROM "Payment";

DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";

CREATE INDEX "Payment_projectId_idx" ON "Payment"("projectId");
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");
CREATE UNIQUE INDEX "Payment_visitId_key" ON "Payment"("visitId");
CREATE INDEX "Payment_visitId_idx" ON "Payment"("visitId");
CREATE INDEX "Payment_categoryId_idx" ON "Payment"("categoryId");
CREATE INDEX "Payment_cashAccountId_idx" ON "Payment"("cashAccountId");
CREATE INDEX "Payment_source_idx" ON "Payment"("source");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_dueDate_idx" ON "Payment"("dueDate");

CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "clientId" TEXT,
    "categoryId" TEXT,
    "cashAccountId" TEXT,
    "description" TEXT NOT NULL,
    "supplier" TEXT,
    "costCenter" TEXT,
    "amount" DECIMAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Expense_projectId_idx" ON "Expense"("projectId");
CREATE INDEX "Expense_clientId_idx" ON "Expense"("clientId");
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");
CREATE INDEX "Expense_cashAccountId_idx" ON "Expense"("cashAccountId");
CREATE INDEX "Expense_status_idx" ON "Expense"("status");
CREATE INDEX "Expense_dueDate_idx" ON "Expense"("dueDate");

CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT,
    "expenseId" TEXT,
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashMovement_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinancialCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "CashAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CashMovement_paymentId_key" ON "CashMovement"("paymentId");
CREATE UNIQUE INDEX "CashMovement_expenseId_key" ON "CashMovement"("expenseId");
CREATE INDEX "CashMovement_type_idx" ON "CashMovement"("type");
CREATE INDEX "CashMovement_date_idx" ON "CashMovement"("date");
CREATE INDEX "CashMovement_origin_idx" ON "CashMovement"("origin");
CREATE INDEX "CashMovement_referenceId_idx" ON "CashMovement"("referenceId");
CREATE INDEX "CashMovement_clientId_idx" ON "CashMovement"("clientId");
CREATE INDEX "CashMovement_projectId_idx" ON "CashMovement"("projectId");
CREATE INDEX "CashMovement_categoryId_idx" ON "CashMovement"("categoryId");
CREATE INDEX "CashMovement_cashAccountId_idx" ON "CashMovement"("cashAccountId");

INSERT INTO "CashMovement" (
    "id",
    "paymentId",
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
    "createdAt",
    "updatedAt"
) SELECT
    'cash_' || "id",
    "id",
    "visitId",
    "clientId",
    "projectId",
    "categoryId",
    "cashAccountId",
    'INCOME',
    "paidAt",
    'Recebimento - ' || "description",
    "paidAmount",
    "paymentMethod",
    CASE WHEN "source" = 'VISIT' THEN 'VISIT_PAYMENT' ELSE 'RECEIVABLE_PAYMENT' END,
    "id",
    "createdAt",
    "updatedAt"
FROM "Payment"
WHERE "paidAmount" > 0 AND "paidAt" IS NOT NULL AND "status" IN ('PAID', 'PARTIALLY_PAID');

PRAGMA foreign_keys=ON;
