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
import { buildProjectFinancialSummary, getFinancialSummary } from "../financial/financial.service.js";

type StatusCount = {
  status: string;
  label: string;
  count: number;
  percentage: number;
};

type ReportProjectSnapshot = {
  id: string;
  name: string;
  type: string;
  status: string;
  contractedAmount: { toString(): string } | number | string | null;
  client: {
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
  status: string;
  finalAmount: { toString(): string } | number | string;
};

type ReportTaskSnapshot = {
  dueDate: Date | null;
  priority: string;
  status: string;
};

type ReportVisitSnapshot = {
  amount: { toString(): string } | number | string | null;
  date: Date;
  status: string;
  type: string;
};

export async function getReportsOverview() {
  const [financial, [clients, projects, budgets, tasks, visits]] = await Promise.all([
    getFinancialSummary(),
    prisma.$transaction([
      prisma.client.findMany({ select: { status: true } }),
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
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
        }
      }),
      prisma.budget.findMany({ select: { finalAmount: true, status: true } }),
      prisma.task.findMany({ select: { dueDate: true, priority: true, status: true } }),
      prisma.visit.findMany({ select: { amount: true, date: true, status: true, type: true } })
    ])
  ]);

  return buildReportsOverview(
    {
      budgets,
      clients,
      financial,
      projects,
      tasks,
      visits
    },
    new Date()
  );
}

export function buildReportsOverview(
  {
    budgets,
    clients,
    financial,
    projects,
    tasks,
    visits
  }: {
    budgets: ReportBudgetSnapshot[];
    clients: Array<{ status: string }>;
    financial: Awaited<ReturnType<typeof getFinancialSummary>>;
    projects: ReportProjectSnapshot[];
    tasks: ReportTaskSnapshot[];
    visits: ReportVisitSnapshot[];
  },
  today = new Date()
) {
  const activeProjects = projects.filter((project) => isActiveProjectStatus(project.status));
  const progresses = activeProjects.map(getProjectProgress);
  const approvedBudgets = budgets.filter((budget) => budget.status === "APPROVED");
  const refusedBudgets = budgets.filter((budget) => budget.status === "REFUSED");
  const openBudgets = budgets.filter((budget) => ["DRAFT", "SENT", "NEGOTIATION"].includes(budget.status));
  const projectFinancials = projects.map((project) => {
    const summary = buildProjectFinancialSummary(project, today);

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
  const openTasks = tasks.filter((task) => isOpenTaskStatus(task.status));
  const overdueTasks = openTasks.filter((task) => task.dueDate && startOfDay(task.dueDate) < startOfDay(today));
  const dueSoonTasks = openTasks.filter(
    (task) => task.dueDate && startOfDay(task.dueDate) >= startOfDay(today) && startOfDay(task.dueDate) <= addDays(startOfDay(today), 7)
  );
  const scheduledVisits = visits.filter((visit) => visit.status === "SCHEDULED");
  const nextVisits = scheduledVisits.filter(
    (visit) => startOfDay(visit.date) >= startOfDay(today) && startOfDay(visit.date) <= addDays(startOfDay(today), 7)
  );
  const decidedBudgets = approvedBudgets.length + refusedBudgets.length;

  return {
    generatedAt: today.toISOString(),
    clients: {
      total: clients.length,
      active: clients.filter((client) => ["ACTIVE", "RECURRING", "IN_SERVICE"].includes(client.status)).length,
      byStatus: countByValues(clientStatuses, clientStatusLabels, clients, (client) => client.status)
    },
    commercial: {
      totalBudgets: budgets.length,
      openBudgets: openBudgets.length,
      approvedBudgets: approvedBudgets.length,
      refusedBudgets: refusedBudgets.length,
      conversionRate: decidedBudgets > 0 ? Math.round((approvedBudgets.length / decidedBudgets) * 100) : 0,
      approvedAmount: sumMoney(approvedBudgets.map((budget) => budget.finalAmount)),
      openAmount: sumMoney(openBudgets.map((budget) => budget.finalAmount)),
      byStatus: countByValues(budgetStatuses, budgetStatusLabels, budgets, (budget) => budget.status)
    },
    financial,
    projects: {
      total: projects.length,
      active: activeProjects.length,
      finished: projects.filter((project) => project.status === "FINISHED").length,
      cancelled: projects.filter((project) => project.status === "CANCELLED").length,
      totalContractedAmount: sumMoney(projects.map((project) => project.contractedAmount)),
      averageProgress:
        progresses.length > 0 ? Math.round(progresses.reduce((total, progress) => total + progress, 0) / progresses.length) : 0,
      byStatus: countByValues(projectStatuses, projectStatusLabels, projects, (project) => project.status),
      byType: countByValues(projectTypes, projectTypeLabels, projects, (project) => project.type),
      topReceivableProjects: projectFinancials
        .filter((project) => Number(project.pendingAmount) > 0 || Number(project.overdueAmount) > 0)
        .sort((first, second) => Number(second.pendingAmount) - Number(first.pendingAmount))
        .slice(0, 5)
    },
    operations: {
      tasksTotal: tasks.length,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      dueSoonTasks: dueSoonTasks.length,
      urgentTasks: openTasks.filter((task) => task.priority === "URGENT").length,
      scheduledVisits: scheduledVisits.length,
      completedVisits: visits.filter((visit) => visit.status === "COMPLETED").length,
      visitsNextSevenDays: nextVisits.length,
      visitsAmount: sumMoney(visits.map((visit) => visit.amount)),
      byTaskStatus: countByValues(taskStatuses, taskStatusLabels, tasks, (task) => task.status),
      byTaskPriority: countByValues(taskPriorities, taskPriorityLabels, tasks, (task) => task.priority),
      byVisitStatus: countByValues(visitStatuses, visitStatusLabels, visits, (visit) => visit.status),
      byVisitType: countByValues(visitTypes, visitTypeLabels, visits, (visit) => visit.type)
    }
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

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}
