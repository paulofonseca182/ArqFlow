import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { calculateProjectProgress } from "../../shared/business-rules.js";
import {
  budgetStatusLabels,
  budgetStatuses,
  clientStatusLabels,
  clientStatuses,
  projectStatusLabels,
  projectStatuses,
  projectTypeLabels,
  projectTypes,
  taskPriorities,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatuses,
  visitStatusLabels,
  visitStatuses,
  visitTypeLabels,
  visitTypes
} from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { buildProjectFinancialSummary, getEffectivePaymentStatus } from "../financial/financial.service.js";
import type { ReportPeriodKey, ReportsOverviewQuery } from "./reports.schema.js";

type StatusCount = {
  status: string;
  label: string;
  count: number;
  percentage: number;
};

type ReportPeriodSnapshot = {
  key: ReportPeriodKey;
  label: string;
  from: Date;
  to: Date;
};

type ReportClientSnapshot = {
  createdAt: Date;
  id: string;
  name: string;
  status: string;
};

type ReportProjectSnapshot = {
  clientId: string;
  createdAt: Date;
  id: string;
  name: string;
  type: string;
  status: string;
  contractedAmount: { toString(): string } | number | string | null;
  client: {
    id: string;
    name: string;
  };
  steps: Array<{
    status: string;
  }>;
  payments: Array<{
    amount: { toString(): string } | number | string;
    paidAmount: { toString(): string } | number | string;
    dueDate: Date;
    status: string;
  }>;
};

type ReportBudgetSnapshot = {
  clientId: string;
  createdAt: Date;
  projectId: string | null;
  status: string;
  finalAmount: { toString(): string } | number | string;
};

type ReportPaymentSnapshot = {
  amount: { toString(): string } | number | string;
  clientId: string;
  dueDate: Date;
  paidAmount: { toString(): string } | number | string;
  paidAt: Date | null;
  projectId: string;
  status: string;
};

type ReportTaskSnapshot = {
  createdAt: Date;
  dueDate: Date | null;
  priority: string;
  projectId: string | null;
  status: string;
};

type ReportVisitSnapshot = {
  amount: { toString(): string } | number | string | null;
  clientId: string;
  date: Date;
  projectId: string | null;
  status: string;
  type: string;
};

type ReportAppliedFilters = {
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
};

export async function getReportsOverview(query: ReportsOverviewQuery) {
  const today = new Date();
  const period = resolveReportPeriod(query, today);
  const filters = await resolveReportFilters(query);
  const [clients, projects, budgets, payments, tasks, visits] = await prisma.$transaction([
      prisma.client.findMany({ where: buildReportClientWhere(query), select: { createdAt: true, id: true, name: true, status: true } }),
      prisma.project.findMany({
        where: buildReportProjectWhere(query),
        select: {
          clientId: true,
          createdAt: true,
          id: true,
          name: true,
          type: true,
          status: true,
          contractedAmount: true,
          client: {
            select: {
              id: true,
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
        }
      }),
      prisma.budget.findMany({
        where: buildReportBudgetWhere(query),
        select: { clientId: true, createdAt: true, finalAmount: true, projectId: true, status: true }
      }),
      prisma.payment.findMany({
        where: buildReportPaymentWhere(query),
        select: { amount: true, clientId: true, dueDate: true, paidAmount: true, paidAt: true, projectId: true, status: true }
      }),
      prisma.task.findMany({
        where: buildReportTaskWhere(query),
        select: { createdAt: true, dueDate: true, priority: true, projectId: true, status: true }
      }),
      prisma.visit.findMany({
        where: buildReportVisitWhere(query),
        select: { amount: true, clientId: true, date: true, projectId: true, status: true, type: true }
      })
  ]);

  return buildReportsOverview(
    {
      budgets,
      clients,
      filters,
      payments,
      period,
      projects,
      tasks,
      visits
    },
    today
  );
}

export function buildReportsOverview(
  {
    budgets,
    clients,
    filters,
    payments,
    period,
    projects,
    tasks,
    visits
  }: {
    budgets: ReportBudgetSnapshot[];
    clients: ReportClientSnapshot[];
    filters?: ReportAppliedFilters;
    payments: ReportPaymentSnapshot[];
    period: ReportPeriodSnapshot;
    projects: ReportProjectSnapshot[];
    tasks: ReportTaskSnapshot[];
    visits: ReportVisitSnapshot[];
  },
  today = new Date()
) {
  const clientsInPeriod = clients.filter((client) => isInPeriod(client.createdAt, period));
  const projectsInPeriod = projects.filter((project) => isInPeriod(project.createdAt, period));
  const budgetsInPeriod = budgets.filter((budget) => isInPeriod(budget.createdAt, period));
  const tasksInPeriod = tasks.filter((task) => isInPeriod(task.dueDate ?? task.createdAt, period));
  const visitsInPeriod = visits.filter((visit) => isInPeriod(visit.date, period));
  const activeProjects = projectsInPeriod.filter((project) => isActiveProjectStatus(project.status));
  const progresses = activeProjects.map(getProjectProgress);
  const approvedBudgets = budgetsInPeriod.filter((budget) => budget.status === "APPROVED");
  const refusedBudgets = budgetsInPeriod.filter((budget) => budget.status === "REFUSED");
  const openBudgets = budgetsInPeriod.filter((budget) => ["DRAFT", "SENT", "NEGOTIATION"].includes(budget.status));
  const projectFinancials = projects.map((project) => {
    const summary = buildProjectFinancialSummary(
      {
        ...project,
        payments: project.payments.filter((payment) => isInPeriod(payment.dueDate, period))
      },
      today
    );

    return {
      id: project.id,
      name: project.name,
      clientName: project.client.name,
      contractedAmount: toMoneyString(summary.contractedAmount),
      receivedAmount: toMoneyString(summary.receivedAmount),
      pendingAmount: toMoneyString(summary.pendingAmount),
      overdueAmount: toMoneyString(summary.overdueAmount)
    };
  });
  const openTasks = tasksInPeriod.filter((task) => isOpenTaskStatus(task.status));
  const overdueTasks = openTasks.filter((task) => task.dueDate && startOfDay(task.dueDate) < startOfDay(today));
  const dueSoonTasks = openTasks.filter(
    (task) => task.dueDate && startOfDay(task.dueDate) >= startOfDay(today) && startOfDay(task.dueDate) <= addDays(startOfDay(today), 7)
  );
  const scheduledVisits = visitsInPeriod.filter((visit) => visit.status === "SCHEDULED");
  const nextVisits = scheduledVisits.filter(
    (visit) => startOfDay(visit.date) >= startOfDay(today) && startOfDay(visit.date) <= addDays(startOfDay(today), 7)
  );
  const decidedBudgets = approvedBudgets.length + refusedBudgets.length;
  const financial = buildPeriodFinancialSummary(payments, projectsInPeriod, period, today);

  return {
    filters: filters ?? {
      clientId: null,
      clientName: null,
      projectId: null,
      projectName: null
    },
    generatedAt: today.toISOString(),
    period: mapReportPeriod(period),
    clients: {
      total: clientsInPeriod.length,
      active: clientsInPeriod.filter((client) => ["ACTIVE", "RECURRING", "IN_SERVICE"].includes(client.status)).length,
      byStatus: countByValues(clientStatuses, clientStatusLabels, clientsInPeriod, (client) => client.status)
    },
    commercial: {
      totalBudgets: budgetsInPeriod.length,
      openBudgets: openBudgets.length,
      approvedBudgets: approvedBudgets.length,
      refusedBudgets: refusedBudgets.length,
      conversionRate: decidedBudgets > 0 ? Math.round((approvedBudgets.length / decidedBudgets) * 100) : 0,
      approvedAmount: sumMoney(approvedBudgets.map((budget) => budget.finalAmount)),
      openAmount: sumMoney(openBudgets.map((budget) => budget.finalAmount)),
      byStatus: countByValues(budgetStatuses, budgetStatusLabels, budgetsInPeriod, (budget) => budget.status)
    },
    financial,
    projects: {
      total: projectsInPeriod.length,
      active: activeProjects.length,
      finished: projectsInPeriod.filter((project) => project.status === "FINISHED").length,
      cancelled: projectsInPeriod.filter((project) => project.status === "CANCELLED").length,
      totalContractedAmount: sumMoney(projectsInPeriod.map((project) => project.contractedAmount)),
      averageProgress:
        progresses.length > 0 ? Math.round(progresses.reduce((total, progress) => total + progress, 0) / progresses.length) : 0,
      byStatus: countByValues(projectStatuses, projectStatusLabels, projectsInPeriod, (project) => project.status),
      byType: countByValues(projectTypes, projectTypeLabels, projectsInPeriod, (project) => project.type),
      topReceivableProjects: projectFinancials
        .filter((project) => Number(project.pendingAmount) > 0 || Number(project.overdueAmount) > 0)
        .sort((first, second) => Number(second.pendingAmount) - Number(first.pendingAmount))
        .slice(0, 5)
    },
    operations: {
      tasksTotal: tasksInPeriod.length,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      dueSoonTasks: dueSoonTasks.length,
      urgentTasks: openTasks.filter((task) => task.priority === "URGENT").length,
      scheduledVisits: scheduledVisits.length,
      completedVisits: visitsInPeriod.filter((visit) => visit.status === "COMPLETED").length,
      visitsNextSevenDays: nextVisits.length,
      visitsAmount: sumMoney(visitsInPeriod.map((visit) => visit.amount)),
      byTaskStatus: countByValues(taskStatuses, taskStatusLabels, tasksInPeriod, (task) => task.status),
      byTaskPriority: countByValues(taskPriorities, taskPriorityLabels, tasksInPeriod, (task) => task.priority),
      byVisitStatus: countByValues(visitStatuses, visitStatusLabels, visitsInPeriod, (visit) => visit.status),
      byVisitType: countByValues(visitTypes, visitTypeLabels, visitsInPeriod, (visit) => visit.type)
    }
  };
}

function buildPeriodFinancialSummary(
  payments: ReportPaymentSnapshot[],
  projects: ReportProjectSnapshot[],
  period: ReportPeriodSnapshot,
  today: Date
) {
  let receivedAmount = 0;
  let receivableAmount = 0;
  let overdueAmount = 0;
  let paidPayments = 0;
  let receivablePayments = 0;
  let overduePayments = 0;

  for (const payment of payments) {
    const amount = toNumber(payment.amount);
    const paidAmount = toNumber(payment.paidAmount);
    const remainingAmount = roundMoney(Math.max(amount - paidAmount, 0));
    const effectiveStatus = getEffectivePaymentStatus(payment, today);

    if (payment.status !== "CANCELLED" && payment.paidAt && isInPeriod(payment.paidAt, period)) {
      receivedAmount += paidAmount;
      paidPayments += 1;
    }

    if (!["PAID", "CANCELLED"].includes(payment.status) && isInPeriod(payment.dueDate, period)) {
      receivableAmount += remainingAmount;
      receivablePayments += 1;
    }

    if (effectiveStatus === "OVERDUE" && isInPeriod(payment.dueDate, period)) {
      overdueAmount += remainingAmount;
      overduePayments += 1;
    }
  }

  const ticketAmounts = projects.map((project) => toNumber(project.contractedAmount)).filter((value) => value > 0);
  const averageProjectTicket =
    ticketAmounts.length > 0 ? ticketAmounts.reduce((total, amount) => total + amount, 0) / ticketAmounts.length : 0;

  return {
    receivedAmount: toMoneyString(receivedAmount),
    receivableAmount: toMoneyString(receivableAmount),
    overdueAmount: toMoneyString(overdueAmount),
    paidPayments,
    receivablePayments,
    overduePayments,
    averageProjectTicket: toMoneyString(averageProjectTicket)
  };
}

async function resolveReportFilters(query: Pick<ReportsOverviewQuery, "clientId" | "projectId">): Promise<ReportAppliedFilters> {
  const [client, project] = await Promise.all([
    query.clientId
      ? prisma.client.findUnique({
          where: { id: query.clientId },
          select: { id: true, name: true }
        })
      : null,
    query.projectId
      ? prisma.project.findUnique({
          where: { id: query.projectId },
          select: {
            clientId: true,
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      : null
  ]);

  if (query.clientId && !client) {
    throw new AppError("CLIENT_NOT_FOUND", "Cliente não encontrado.", 404);
  }

  if (query.projectId && !project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  if (query.clientId && project && project.clientId !== query.clientId) {
    throw new AppError("REPORT_SCOPE_PROJECT_CLIENT_MISMATCH", "O projeto informado não pertence ao cliente selecionado.", 422);
  }

  return {
    clientId: client?.id ?? null,
    clientName: client?.name ?? null,
    projectId: project?.id ?? null,
    projectName: project?.name ?? null
  };
}

function buildReportClientWhere({ clientId, projectId }: Pick<ReportsOverviewQuery, "clientId" | "projectId">): Prisma.ClientWhereInput {
  return {
    ...(clientId ? { id: clientId } : {}),
    ...(projectId ? { projects: { some: { id: projectId } } } : {})
  };
}

function buildReportProjectWhere({ clientId, projectId }: Pick<ReportsOverviewQuery, "clientId" | "projectId">): Prisma.ProjectWhereInput {
  return {
    ...(clientId ? { clientId } : {}),
    ...(projectId ? { id: projectId } : {})
  };
}

function buildReportBudgetWhere({ clientId, projectId }: Pick<ReportsOverviewQuery, "clientId" | "projectId">): Prisma.BudgetWhereInput {
  return {
    ...(clientId ? { clientId } : {}),
    ...(projectId ? { projectId } : {})
  };
}

function buildReportPaymentWhere({ clientId, projectId }: Pick<ReportsOverviewQuery, "clientId" | "projectId">): Prisma.PaymentWhereInput {
  return {
    ...(clientId ? { clientId } : {}),
    ...(projectId ? { projectId } : {})
  };
}

function buildReportTaskWhere({ clientId, projectId }: Pick<ReportsOverviewQuery, "clientId" | "projectId">): Prisma.TaskWhereInput {
  return {
    ...(projectId ? { projectId } : {}),
    ...(clientId ? { project: { clientId } } : {})
  };
}

function buildReportVisitWhere({ clientId, projectId }: Pick<ReportsOverviewQuery, "clientId" | "projectId">): Prisma.VisitWhereInput {
  return {
    ...(clientId ? { clientId } : {}),
    ...(projectId ? { projectId } : {})
  };
}

function resolveReportPeriod(query: ReportsOverviewQuery, today: Date): ReportPeriodSnapshot {
  if (query.period === "CUSTOM" && query.from && query.to) {
    return {
      key: "CUSTOM",
      label: "Intervalo personalizado",
      from: startOfDay(query.from),
      to: endOfDay(query.to)
    };
  }

  if (query.period === "CURRENT_YEAR") {
    return {
      key: "CURRENT_YEAR",
      label: "Ano atual",
      from: new Date(today.getFullYear(), 0, 1),
      to: endOfDay(new Date(today.getFullYear(), 11, 31))
    };
  }

  return {
    key: "CURRENT_MONTH",
    label: "Mês atual",
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  };
}

function mapReportPeriod(period: ReportPeriodSnapshot) {
  return {
    key: period.key,
    label: period.label,
    from: period.from.toISOString(),
    to: period.to.toISOString()
  };
}

function countByValues<T extends string, R>(
  values: readonly T[],
  labels: Record<T, string>,
  records: R[],
  getValue: (record: R) => string
): StatusCount[] {
  return values.map((value) => {
    const count = records.filter((record) => getValue(record) === value).length;

    return {
      status: value,
      label: labels[value],
      count,
      percentage: records.length > 0 ? Math.round((count / records.length) * 100) : 0
    };
  });
}

function getProjectProgress(project: ReportProjectSnapshot) {
  const totalSteps = project.steps.length;
  const completedSteps = project.steps.filter((step) => step.status === "COMPLETED").length;

  return calculateProjectProgress(totalSteps, completedSteps);
}

function isActiveProjectStatus(status: string) {
  return status !== "FINISHED" && status !== "CANCELLED";
}

function isOpenTaskStatus(status: string) {
  return !["COMPLETED", "CANCELLED"].includes(status);
}

function isInPeriod(date: Date, period: ReportPeriodSnapshot) {
  return date >= period.from && date <= period.to;
}

function sumMoney(values: Array<{ toString(): string } | number | string | null | undefined>) {
  return toMoneyString(values.reduce<number>((total, value) => total + toNumber(value), 0));
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

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
