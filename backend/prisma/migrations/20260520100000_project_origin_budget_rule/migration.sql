ALTER TABLE "Project" ADD COLUMN "budgetId" TEXT REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Project" ADD COLUMN "manualReason" TEXT;
ALTER TABLE "Project" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "Project" ADD COLUMN "convertedAt" DATETIME;

ALTER TABLE "Budget" ADD COLUMN "convertedProjectId" TEXT REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "Budget" ADD COLUMN "convertedAt" DATETIME;

CREATE UNIQUE INDEX "Project_budgetId_key" ON "Project"("budgetId");
CREATE INDEX "Project_budgetId_idx" ON "Project"("budgetId");
CREATE INDEX "Project_origin_idx" ON "Project"("origin");

CREATE UNIQUE INDEX "Budget_convertedProjectId_key" ON "Budget"("convertedProjectId");
CREATE INDEX "Budget_convertedProjectId_idx" ON "Budget"("convertedProjectId");
