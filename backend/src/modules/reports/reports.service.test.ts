import { describe, expect, it } from "vitest";
import { buildReportsOverview } from "./reports.service.js";

describe("reports service", () => {
  it("consolida indicadores reais dentro do período informado", () => {
    const overview = buildReportsOverview(
      {
        budgets: [
          { clientId: "client-1", createdAt: new Date(2026, 4, 2), finalAmount: "1000", projectId: "project-1", status: "APPROVED" },
          { clientId: "client-2", createdAt: new Date(2026, 4, 3), finalAmount: "600", projectId: "project-2", status: "REFUSED" },
          { clientId: "client-1", createdAt: new Date(2026, 4, 4), finalAmount: "400", projectId: null, status: "SENT" },
          { clientId: "client-3", createdAt: new Date(2026, 3, 25), finalAmount: "900", projectId: "project-3", status: "APPROVED" }
        ],
        clients: [
          { createdAt: new Date(2026, 4, 1), id: "client-1", name: "Ana", status: "ACTIVE" },
          { createdAt: new Date(2026, 4, 5), id: "client-2", name: "Bruno", status: "NEW_CONTACT" },
          { createdAt: new Date(2026, 3, 20), id: "client-3", name: "Carla", status: "ACTIVE" }
        ],
        payments: [
          {
            amount: "1000",
            clientId: "client-1",
            dueDate: new Date(2026, 4, 10),
            paidAmount: "200",
            paidAt: new Date(2026, 4, 12),
            projectId: "project-1",
            status: "RECEIVABLE"
          },
          {
            amount: "500",
            clientId: "client-3",
            dueDate: new Date(2026, 3, 10),
            paidAmount: "500",
            paidAt: new Date(2026, 3, 11),
            projectId: "project-3",
            status: "PAID"
          }
        ],
        period: {
          from: new Date(2026, 4, 1),
          key: "CUSTOM",
          label: "Maio",
          to: new Date(2026, 4, 31, 23, 59, 59, 999)
        },
        projects: [
          {
            client: { id: "client-1", name: "Ana" },
            clientId: "client-1",
            contractedAmount: "1000",
            createdAt: new Date(2026, 4, 5),
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
            client: { id: "client-2", name: "Bruno" },
            clientId: "client-2",
            contractedAmount: "800",
            createdAt: new Date(2026, 4, 8),
            id: "project-2",
            name: "Loja Bruno",
            payments: [],
            status: "FINISHED",
            steps: [{ status: "COMPLETED" }],
            type: "COMMERCIAL"
          },
          {
            client: { id: "client-3", name: "Carla" },
            clientId: "client-3",
            contractedAmount: "1500",
            createdAt: new Date(2026, 3, 8),
            id: "project-3",
            name: "Apartamento Carla",
            payments: [],
            status: "CONTRACT_SIGNED",
            steps: [],
            type: "INTERIORS"
          }
        ],
        tasks: [
          { createdAt: new Date(2026, 4, 1), dueDate: new Date(2026, 4, 10), priority: "URGENT", projectId: "project-1", status: "PENDING" },
          { createdAt: new Date(2026, 4, 1), dueDate: new Date(2026, 4, 17), priority: "MEDIUM", projectId: "project-1", status: "IN_PROGRESS" },
          { createdAt: new Date(2026, 4, 1), dueDate: null, priority: "LOW", projectId: null, status: "COMPLETED" },
          { createdAt: new Date(2026, 3, 1), dueDate: new Date(2026, 3, 10), priority: "URGENT", projectId: "project-3", status: "PENDING" }
        ],
        visits: [
          { amount: "250", clientId: "client-1", date: new Date(2026, 4, 16), projectId: "project-1", status: "SCHEDULED", type: "TECHNICAL_VISIT" },
          { amount: "150", clientId: "client-2", date: new Date(2026, 4, 20), projectId: "project-2", status: "COMPLETED", type: "CLIENT_MEETING" },
          { amount: "500", clientId: "client-3", date: new Date(2026, 3, 20), projectId: "project-3", status: "SCHEDULED", type: "OTHER" }
        ]
      },
      new Date(2026, 4, 15)
    );

    expect(overview.filters).toEqual({
      clientId: null,
      clientName: null,
      projectId: null,
      projectName: null
    });
    expect(overview.period.from).toBe(new Date(2026, 4, 1).toISOString());
    expect(overview.clients.total).toBe(2);
    expect(overview.commercial.conversionRate).toBe(50);
    expect(overview.commercial.approvedAmount).toBe("1000.00");
    expect(overview.commercial.openAmount).toBe("400.00");
    expect(overview.financial.receivedAmount).toBe("200.00");
    expect(overview.financial.receivableAmount).toBe("800.00");
    expect(overview.financial.overdueAmount).toBe("800.00");
    expect(overview.financial.averageProjectTicket).toBe("900.00");
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
