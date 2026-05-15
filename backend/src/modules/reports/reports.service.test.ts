import { describe, expect, it } from "vitest";
import { buildReportsOverview } from "./reports.service.js";

const emptyFinancial = {
  approvedBudgets: 0,
  averageProjectTicket: "0.00",
  dueSoonAmount: "0.00",
  dueSoonCount: 0,
  overdueAmount: "0.00",
  overdueCount: 0,
  receivableAmount: "0.00",
  receivedAmount: "0.00",
  refusedBudgets: 0,
  revenueMonth: "0.00",
  revenueYear: "0.00"
};

describe("reports service", () => {
  it("consolida indicadores reais de comercial, projetos e operação", () => {
    const overview = buildReportsOverview(
      {
        budgets: [
          { finalAmount: "1000", status: "APPROVED" },
          { finalAmount: "600", status: "REFUSED" },
          { finalAmount: "400", status: "SENT" }
        ],
        clients: [{ status: "ACTIVE" }, { status: "NEW_CONTACT" }],
        financial: emptyFinancial,
        projects: [
          {
            client: { name: "Ana" },
            contractedAmount: "1000",
            id: "project-1",
            name: "Casa Ana",
            payments: [
              {
                amount: "1000",
                dueDate: new Date(2026, 4, 10),
                paidAmount: "200",
                status: "RECEIVABLE"
              }
            ],
            status: "CONTRACT_SIGNED",
            steps: [{ status: "COMPLETED" }, { status: "PENDING" }],
            type: "RESIDENTIAL"
          },
          {
            client: { name: "Bruno" },
            contractedAmount: "800",
            id: "project-2",
            name: "Loja Bruno",
            payments: [],
            status: "FINISHED",
            steps: [{ status: "COMPLETED" }],
            type: "COMMERCIAL"
          }
        ],
        tasks: [
          { dueDate: new Date(2026, 4, 10), priority: "URGENT", status: "PENDING" },
          { dueDate: new Date(2026, 4, 17), priority: "MEDIUM", status: "IN_PROGRESS" },
          { dueDate: null, priority: "LOW", status: "COMPLETED" }
        ],
        visits: [
          { amount: "250", date: new Date(2026, 4, 16), status: "SCHEDULED", type: "TECHNICAL_VISIT" },
          { amount: "150", date: new Date(2026, 4, 20), status: "COMPLETED", type: "CLIENT_MEETING" }
        ]
      },
      new Date(2026, 4, 15)
    );

    expect(overview.clients.total).toBe(2);
    expect(overview.commercial.conversionRate).toBe(50);
    expect(overview.commercial.approvedAmount).toBe("1000.00");
    expect(overview.commercial.openAmount).toBe("400.00");
    expect(overview.projects.active).toBe(1);
    expect(overview.projects.averageProgress).toBe(50);
    expect(overview.projects.totalContractedAmount).toBe("1800.00");
    expect(overview.projects.topReceivableProjects).toEqual([
      {
        clientName: "Ana",
        contractedAmount: "1000.00",
        id: "project-1",
        name: "Casa Ana",
        overdueAmount: "800.00",
        pendingAmount: "800.00",
        receivedAmount: "200.00"
      }
    ]);
    expect(overview.operations.openTasks).toBe(2);
    expect(overview.operations.overdueTasks).toBe(1);
    expect(overview.operations.dueSoonTasks).toBe(1);
    expect(overview.operations.urgentTasks).toBe(1);
    expect(overview.operations.visitsNextSevenDays).toBe(1);
    expect(overview.operations.visitsAmount).toBe("400.00");
  });
});
