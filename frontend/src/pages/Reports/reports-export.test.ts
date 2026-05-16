import { describe, expect, it } from "vitest";
import type { ReportsOverview } from "../../types/reports";
import { buildReportsCsv, createReportExportFilename } from "./reports-export";

const overview: ReportsOverview = {
  generatedAt: "2026-05-16T12:00:00.000Z",
  period: {
    from: "2026-05-01T12:00:00.000Z",
    key: "CURRENT_MONTH",
    label: "Mês atual",
    to: "2026-05-31T12:00:00.000Z"
  },
  clients: {
    active: 2,
    byStatus: [{ count: 2, label: "Cliente ativo", percentage: 100, status: "ACTIVE" }],
    total: 3
  },
  commercial: {
    approvedAmount: "1200.00",
    approvedBudgets: 1,
    byStatus: [{ count: 1, label: "Aprovado", percentage: 50, status: "APPROVED" }],
    conversionRate: 50,
    openAmount: "800.00",
    openBudgets: 2,
    refusedBudgets: 1,
    totalBudgets: 4
  },
  financial: {
    averageProjectTicket: "1000.00",
    overdueAmount: "300.00",
    overduePayments: 1,
    paidPayments: 2,
    receivableAmount: "500.00",
    receivablePayments: 3,
    receivedAmount: "700.00"
  },
  operations: {
    byTaskPriority: [{ count: 1, label: "Urgente", percentage: 100, status: "URGENT" }],
    byTaskStatus: [{ count: 1, label: "Pendente", percentage: 100, status: "PENDING" }],
    byVisitStatus: [{ count: 1, label: "Agendada", percentage: 100, status: "SCHEDULED" }],
    byVisitType: [{ count: 1, label: "Visita técnica", percentage: 100, status: "TECHNICAL_VISIT" }],
    completedVisits: 0,
    dueSoonTasks: 1,
    openTasks: 2,
    overdueTasks: 1,
    scheduledVisits: 1,
    tasksTotal: 3,
    urgentTasks: 1,
    visitsAmount: "250.00",
    visitsNextSevenDays: 1
  },
  projects: {
    active: 1,
    averageProgress: 40,
    byStatus: [{ count: 1, label: "Contrato assinado", percentage: 100, status: "CONTRACT_SIGNED" }],
    byType: [{ count: 1, label: "Residencial", percentage: 100, status: "RESIDENTIAL" }],
    cancelled: 0,
    finished: 0,
    topReceivableProjects: [
      {
        clientName: "Ana Arquitetura",
        contractedAmount: "1000.00",
        id: "project-1",
        name: "Casa Ana",
        overdueAmount: "300.00",
        pendingAmount: "500.00",
        receivedAmount: "500.00"
      }
    ],
    total: 1,
    totalContractedAmount: "1000.00"
  }
};

describe("reports export", () => {
  it("monta CSV com cabeçalho, período, indicadores e recebíveis", () => {
    const csv = buildReportsCsv(overview);

    expect(csv).toContain("Grupo;Indicador;Valor;Detalhe");
    expect(csv).toContain("Período;Nome;Mês atual;2026-05-01 a 2026-05-31");
    expect(csv).toContain("Financeiro;A receber;500.00;BRL");
    expect(csv).toContain("Recebíveis por projeto;Casa Ana;500.00;Ana Arquitetura | atrasado 300.00");
  });

  it("gera nome previsível para o arquivo exportado", () => {
    expect(createReportExportFilename(overview)).toBe("arqflow-relatorios-current_month-2026-05-01-2026-05-31.csv");
  });
});
