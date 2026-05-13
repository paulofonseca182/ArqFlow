import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { calculateProjectProgress } from "../../shared/business-rules.js";
import { projectStatusLabels, projectStatuses } from "../../shared/domain.js";
import { buildProjectFinancialSummary, getFinancialSummary } from "../financial/financial.service.js";

type FinancialSummary = Awaited<ReturnType<typeof getFinancialSummary>>;

export type DashboardProjectSnapshot = {
  id: string;
  name: string;
  status: string;
  expectedDeliveryDate: Date | null;
  client: {
    name: string;
  };
  steps: Array<{
    status: string;
  }>;
  contractedAmount: { toString(): string } | number | string | null;
  payments: Array<{
    amount: { toString(): string } | number | string;
    paidAmount: { toString(): string } | number | string;
    dueDate: Date;
    status: string;
  }>;
};

type DashboardAlertSeverity = "danger" | "warning" | "info";
type DashboardAlertType = "PAYMENT_OVERDUE" | "PAYMENT_DUE_SOON" | "PROJECT_DELIVERY_SOON" | "PROJECT_OVER_CONTRACTED";

const dashboardProjectSelect = {
  id: true,
  name: true,
  status: true,
  expectedDeliveryDate: true,
  contractedAmount: true,
  client: {
    select: {
      name: true
    }
  },
  steps: {
    select: {
      status: true
    }
  },
  payments: {
    select: {
      amount: true,
      paidAmount: true,
      dueDate: true,
      status: true
    }
  }
} satisfies Prisma.ProjectSelect;

type DashboardProjectRecord = Prisma.ProjectGetPayload<{ select: typeof dashboardProjectSelect }>;

export async function getDashboardSummary() {
  const financial = await getFinancialSummary();
  const [clientsTotal, projects] = await prisma.$transaction([
    prisma.client.count(),
    prisma.project.findMany({
      select: dashboardProjectSelect,
      orderBy: [{ expectedDeliveryDate: "asc" }, { updatedAt: "desc" }]
    })
  ]);
  const projectSummary = buildProjectDashboard(projects);
  const alerts = buildDashboardAlerts({
    deliverySoonCount: projectSummary.nextDeliveries.filter((delivery) => {
      const dueDate = new Date(delivery.expectedDeliveryDate);

      return dueDate <= addDays(startOfDay(new Date()), 14);
    }).length,
    financial,
    overContractedProjects: getOverContractedProjects(projects)
  });

  return {
    generatedAt: new Date().toISOString(),
    metrics: {
      clientsTotal,
      activeProjects: projectSummary.active,
      projectsInProgress: projectSummary.active,
      overduePayments: financial.overdueCount,
      dueSoonPayments: financial.dueSoonCount
    },
    financial,
    projects: projectSummary,
    alerts
  };
}

export function buildProjectDashboard(projects: DashboardProjectSnapshot[], today = new Date()) {
  const activeProjects = projects.filter((project) => isActiveProjectStatus(project.status));
  const progresses = activeProjects.map(getProjectProgress);
  const averageProgress =
    progresses.length > 0 ? Math.round(progresses.reduce((total, progress) => total + progress, 0) / progresses.length) : 0;
  const nextDeliveries = activeProjects
    .filter((project) => project.expectedDeliveryDate && startOfDay(project.expectedDeliveryDate) >= startOfDay(today))
    .sort((first, second) => Number(first.expectedDeliveryDate) - Number(second.expectedDeliveryDate))
    .slice(0, 5)
    .map((project) => ({
      id: project.id,
      name: project.name,
      clientName: project.client.name,
      expectedDeliveryDate: project.expectedDeliveryDate?.toISOString() ?? "",
      status: project.status,
      progress: getProjectProgress(project)
    }));

  return {
    total: projects.length,
    active: activeProjects.length,
    finished: projects.filter((project) => project.status === "FINISHED").length,
    cancelled: projects.filter((project) => project.status === "CANCELLED").length,
    averageProgress,
    byStatus: projectStatuses.map((status) => ({
      status,
      label: projectStatusLabels[status],
      count: projects.filter((project) => project.status === status).length
    })),
    nextDeliveries
  };
}

export function buildDashboardAlerts({
  deliverySoonCount,
  financial,
  overContractedProjects
}: {
  deliverySoonCount: number;
  financial: Pick<FinancialSummary, "dueSoonAmount" | "dueSoonCount" | "overdueAmount" | "overdueCount">;
  overContractedProjects: Array<{ id: string; name: string; overContractedAmount: string }>;
}) {
  const alerts: Array<{
    id: string;
    type: DashboardAlertType;
    severity: DashboardAlertSeverity;
    title: string;
    message: string;
    amount?: string;
    count?: number;
    targetId?: string;
    targetType?: "project";
  }> = [];

  if (financial.overdueCount > 0) {
    alerts.push({
      amount: financial.overdueAmount,
      count: financial.overdueCount,
      id: "payment-overdue",
      message: `${financial.overdueCount} parcela${financial.overdueCount === 1 ? "" : "s"} em atraso.`,
      severity: "danger",
      title: "Pagamentos atrasados",
      type: "PAYMENT_OVERDUE"
    });
  }

  if (financial.dueSoonCount > 0) {
    alerts.push({
      amount: financial.dueSoonAmount,
      count: financial.dueSoonCount,
      id: "payment-due-soon",
      message: `${financial.dueSoonCount} parcela${financial.dueSoonCount === 1 ? "" : "s"} vencem nos próximos 7 dias.`,
      severity: "warning",
      title: "Pagamentos vencendo",
      type: "PAYMENT_DUE_SOON"
    });
  }

  if (deliverySoonCount > 0) {
    alerts.push({
      count: deliverySoonCount,
      id: "project-delivery-soon",
      message: `${deliverySoonCount} entrega${deliverySoonCount === 1 ? " prevista" : "s previstas"} para os próximos 14 dias.`,
      severity: "info",
      title: "Entregas próximas",
      type: "PROJECT_DELIVERY_SOON"
    });
  }

  for (const project of overContractedProjects.slice(0, 3)) {
    alerts.push({
      amount: project.overContractedAmount,
      id: `project-over-contracted-${project.id}`,
      message: `${project.name} possui parcelas acima do valor contratado.`,
      severity: "warning",
      targetId: project.id,
      targetType: "project",
      title: "Parcelas acima do contratado",
      type: "PROJECT_OVER_CONTRACTED"
    });
  }

  return alerts;
}

function getProjectProgress(project: DashboardProjectSnapshot) {
  const totalSteps = project.steps.length;
  const completedSteps = project.steps.filter((step) => step.status === "COMPLETED").length;

  return calculateProjectProgress(totalSteps, completedSteps);
}

function getOverContractedProjects(projects: DashboardProjectRecord[]) {
  return projects
    .map((project) => {
      const summary = buildProjectFinancialSummary(project);

      return {
        id: project.id,
        name: project.name,
        hasOverContractedAlert: summary.hasOverContractedAlert,
        overContractedAmount: summary.overContractedAmount.toFixed(2)
      };
    })
    .filter((project) => project.hasOverContractedAlert);
}

function isActiveProjectStatus(status: string) {
  return status !== "FINISHED" && status !== "CANCELLED";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
