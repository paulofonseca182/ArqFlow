import { describe, expect, it } from "vitest";
import { buildDashboardAlerts, buildProjectDashboard } from "./dashboard.service.js";

describe("dashboard service", () => {
  it("calcula projetos ativos, progresso médio e próximas entregas", () => {
    const dashboard = buildProjectDashboard(
      [
        {
          client: { name: "Ana" },
          contractedAmount: "1000",
          expectedDeliveryDate: new Date(2026, 4, 20),
          id: "project-1",
          name: "Projeto 1",
          payments: [],
          status: "CONTRACT_SIGNED",
          steps: [{ status: "COMPLETED" }, { status: "PENDING" }]
        },
        {
          client: { name: "Bruno" },
          contractedAmount: "2000",
          expectedDeliveryDate: new Date(2026, 4, 25),
          id: "project-2",
          name: "Projeto 2",
          payments: [],
          status: "FINISHED",
          steps: [{ status: "COMPLETED" }]
        }
      ],
      new Date(2026, 4, 13)
    );

    expect(dashboard.active).toBe(1);
    expect(dashboard.finished).toBe(1);
    expect(dashboard.averageProgress).toBe(50);
    expect(dashboard.nextDeliveries).toEqual([
      {
        clientName: "Ana",
        expectedDeliveryDate: new Date(2026, 4, 20).toISOString(),
        id: "project-1",
        name: "Projeto 1",
        progress: 50,
        status: "CONTRACT_SIGNED"
      }
    ]);
  });

  it("monta alertas operacionais a partir de dados financeiros", () => {
    expect(
      buildDashboardAlerts({
        deliverySoonCount: 1,
        financial: {
          dueSoonAmount: "500.00",
          dueSoonCount: 2,
          overdueAmount: "300.00",
          overdueCount: 1
        },
        operations: {
          overdueTasks: 2,
          visitsNextSevenDays: 3
        },
        overContractedProjects: [{ id: "project-1", name: "Projeto 1", overContractedAmount: "150.00" }]
      })
    ).toEqual([
      {
        amount: "300.00",
        count: 1,
        id: "payment-overdue",
        message: "1 parcela em atraso.",
        severity: "danger",
        title: "Pagamentos atrasados",
        type: "PAYMENT_OVERDUE"
      },
      {
        amount: "500.00",
        count: 2,
        id: "payment-due-soon",
        message: "2 parcelas vencem nos próximos 7 dias.",
        severity: "warning",
        title: "Pagamentos vencendo",
        type: "PAYMENT_DUE_SOON"
      },
      {
        count: 1,
        id: "project-delivery-soon",
        message: "1 entrega prevista para os próximos 14 dias.",
        severity: "info",
        title: "Entregas próximas",
        type: "PROJECT_DELIVERY_SOON"
      },
      {
        count: 2,
        id: "task-overdue",
        message: "2 tarefas com prazo vencido.",
        severity: "warning",
        title: "Tarefas atrasadas",
        type: "TASK_OVERDUE"
      },
      {
        count: 3,
        id: "visit-due-soon",
        message: "3 visitas agendadas nos próximos 7 dias.",
        severity: "info",
        title: "Visitas próximas",
        type: "VISIT_DUE_SOON"
      },
      {
        amount: "150.00",
        id: "project-over-contracted-project-1",
        message: "Projeto 1 possui parcelas acima do valor contratado.",
        severity: "warning",
        targetId: "project-1",
        targetType: "project",
        title: "Parcelas acima do contratado",
        type: "PROJECT_OVER_CONTRACTED"
      }
    ]);
  });
});
