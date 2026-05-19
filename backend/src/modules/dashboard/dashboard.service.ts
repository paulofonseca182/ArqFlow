import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { calculateProjectProgress } from "../../shared/business-rules.js";
import {
  paymentStatusLabels,
  projectStatusLabels,
  projectStatuses,
  taskPriorityLabels,
  taskStatusLabels,
  visitStatusLabels,
  visitTypeLabels
} from "../../shared/domain.js";
import { buildProjectFinancialSummary, getEffectivePaymentStatus, getFinancialSummary } from "../financial/financial.service.js";

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
type DashboardAlertType =
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DUE_SOON"
  | "PROJECT_DELIVERY_SOON"
  | "PROJECT_OVER_CONTRACTED"
  | "TASK_OVERDUE"
  | "VISIT_DUE_SOON";

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

const dashboardPaymentDetailSelect = {
  id: true,
  description: true,
  amount: true,
  paidAmount: true,
  dueDate: true,
  status: true,
  clientId: true,
  projectId: true,
  client: {
    select: {
      id: true,
      name: true
    }
  },
  project: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.PaymentSelect;

const dashboardTaskDetailSelect = {
  id: true,
  title: true,
  dueDate: true,
  priority: true,
  status: true,
  projectId: true,
  project: {
    select: {
      id: true,
      name: true,
      client: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.TaskSelect;

const dashboardVisitDetailSelect = {
  id: true,
  type: true,
  date: true,
  time: true,
  address: true,
  amount: true,
  status: true,
  clientId: true,
  projectId: true,
  client: {
    select: {
      id: true,
      name: true
    }
  },
  project: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.VisitSelect;

type DashboardPaymentDetailRecord = Prisma.PaymentGetPayload<{ select: typeof dashboardPaymentDetailSelect }>;
type DashboardTaskDetailRecord = Prisma.TaskGetPayload<{ select: typeof dashboardTaskDetailSelect }>;
type DashboardVisitDetailRecord = Prisma.VisitGetPayload<{ select: typeof dashboardVisitDetailSelect }>;

export async function getDashboardSummary() {
  const financial = await getFinancialSummary();
  const today = startOfDay(new Date());
  const sevenDaysFromToday = addDays(today, 7);
  const [
    clientsTotal,
    projects,
    tasksTotal,
    openTasks,
    overdueTasks,
    tasksDueSoon,
    scheduledVisits,
    visitsToday,
    visitsNextSevenDays,
    openBudgets,
    overduePaymentDetails,
    dueSoonPaymentDetails,
    criticalTaskDetails,
    upcomingVisitDetails
  ] = await prisma.$transaction([
    prisma.client.count(),
    prisma.project.findMany({
      select: dashboardProjectSelect,
      orderBy: [{ expectedDeliveryDate: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.task.count(),
    prisma.task.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.task.count({ where: { dueDate: { lt: today }, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.task.count({
      where: {
        dueDate: {
          gte: today,
          lte: sevenDaysFromToday
        },
        status: { notIn: ["COMPLETED", "CANCELLED"] }
      }
    }),
    prisma.visit.count({ where: { status: "SCHEDULED" } }),
    prisma.visit.count({ where: { date: { gte: today, lte: endOfDay(today) }, status: "SCHEDULED" } }),
    prisma.visit.count({ where: { date: { gte: today, lte: endOfDay(sevenDaysFromToday) }, status: "SCHEDULED" } }),
    prisma.budget.count({ where: { status: { in: ["DRAFT", "SENT", "NEGOTIATION"] } } }),
    prisma.payment.findMany({
      where: { dueDate: { lt: today }, status: { notIn: ["PAID", "CANCELLED"] } },
      select: dashboardPaymentDetailSelect,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 5
    }),
    prisma.payment.findMany({
      where: { dueDate: { gte: today, lte: endOfDay(sevenDaysFromToday) }, status: { notIn: ["PAID", "CANCELLED"] } },
      select: dashboardPaymentDetailSelect,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 5
    }),
    prisma.task.findMany({
      where: {
        OR: [{ priority: "URGENT" }, { dueDate: { lt: today } }],
        status: { notIn: ["COMPLETED", "CANCELLED"] }
      },
      select: dashboardTaskDetailSelect,
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 5
    }),
    prisma.visit.findMany({
      where: { date: { gte: today, lte: endOfDay(sevenDaysFromToday) }, status: "SCHEDULED" },
      select: dashboardVisitDetailSelect,
      orderBy: [{ date: "asc" }, { updatedAt: "desc" }],
      take: 5
    })
  ]);
  const projectSummary = buildProjectDashboard(projects);
  const operations = {
    tasksTotal,
    openTasks,
    overdueTasks,
    tasksDueSoon,
    scheduledVisits,
    visitsToday,
    visitsNextSevenDays,
    openBudgets
  };
  const alerts = buildDashboardAlerts({
    deliverySoonCount: projectSummary.nextDeliveries.filter((delivery) => {
      const dueDate = new Date(delivery.expectedDeliveryDate);

      return dueDate <= addDays(startOfDay(new Date()), 14);
    }).length,
    financial,
    operations,
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
    operations,
    alerts,
    details: {
      overduePayments: overduePaymentDetails.map((payment) => mapDashboardPaymentDetail(payment, today)),
      dueSoonPayments: dueSoonPaymentDetails.map((payment) => mapDashboardPaymentDetail(payment, today)),
      criticalTasks: criticalTaskDetails.map((task) => mapDashboardTaskDetail(task, today)),
      upcomingVisits: upcomingVisitDetails.map(mapDashboardVisitDetail)
    }
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
  operations,
  overContractedProjects
}: {
  deliverySoonCount: number;
  financial: Pick<FinancialSummary, "dueSoonAmount" | "dueSoonCount" | "overdueAmount" | "overdueCount">;
  operations?: {
    overdueTasks: number;
    visitsNextSevenDays: number;
  };
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

  if (operations?.overdueTasks) {
    alerts.push({
      count: operations.overdueTasks,
      id: "task-overdue",
      message: `${operations.overdueTasks} tarefa${operations.overdueTasks === 1 ? "" : "s"} com prazo vencido.`,
      severity: "warning",
      title: "Tarefas atrasadas",
      type: "TASK_OVERDUE"
    });
  }

  if (operations?.visitsNextSevenDays) {
    alerts.push({
      count: operations.visitsNextSevenDays,
      id: "visit-due-soon",
      message: `${operations.visitsNextSevenDays} visita${operations.visitsNextSevenDays === 1 ? "" : "s"} agendada${operations.visitsNextSevenDays === 1 ? "" : "s"} nos próximos 7 dias.`,
      severity: "info",
      title: "Visitas próximas",
      type: "VISIT_DUE_SOON"
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

function mapDashboardPaymentDetail(payment: DashboardPaymentDetailRecord, today: Date) {
  const amount = toNumber(payment.amount);
  const paidAmount = toNumber(payment.paidAmount);
  const remainingAmount = roundMoney(Math.max(amount - paidAmount, 0));
  const status = getEffectivePaymentStatus(payment, today);

  return {
    id: payment.id,
    description: payment.description,
    clientId: payment.clientId,
    clientName: payment.client.name,
    projectId: payment.projectId,
    projectName: payment.project.name,
    amount: toMoneyString(amount),
    paidAmount: toMoneyString(paidAmount),
    remainingAmount: toMoneyString(remainingAmount),
    dueDate: payment.dueDate.toISOString(),
    status,
    statusLabel: paymentStatusLabels[status]
  };
}

function mapDashboardTaskDetail(task: DashboardTaskDetailRecord, today: Date) {
  const criticalReason = task.dueDate && startOfDay(task.dueDate) < startOfDay(today) ? "Atrasada" : "Urgente";

  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate?.toISOString() ?? null,
    priority: task.priority,
    priorityLabel: taskPriorityLabels[task.priority as keyof typeof taskPriorityLabels] ?? task.priority,
    status: task.status,
    statusLabel: taskStatusLabels[task.status as keyof typeof taskStatusLabels] ?? task.status,
    projectId: task.projectId,
    projectName: task.project?.name ?? null,
    clientId: task.project?.client.id ?? null,
    clientName: task.project?.client.name ?? null,
    criticalReason
  };
}

function mapDashboardVisitDetail(visit: DashboardVisitDetailRecord) {
  return {
    id: visit.id,
    type: visit.type,
    typeLabel: visitTypeLabels[visit.type as keyof typeof visitTypeLabels] ?? visit.type,
    status: visit.status,
    statusLabel: visitStatusLabels[visit.status as keyof typeof visitStatusLabels] ?? visit.status,
    date: visit.date.toISOString(),
    time: visit.time,
    address: visit.address,
    amount: toMoneyString(toNumber(visit.amount)),
    clientId: visit.clientId,
    clientName: visit.client.name,
    projectId: visit.projectId,
    projectName: visit.project?.name ?? null
  };
}

function isActiveProjectStatus(status: string) {
  return status !== "FINISHED" && status !== "CANCELLED";
}

function toNumber(value: { toString(): string } | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value.toString());
}

function toMoneyString(value: number) {
  return roundMoney(value).toFixed(2);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
