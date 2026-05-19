import type { FinancialSummary } from "./financial";

export type DashboardAlertSeverity = "danger" | "warning" | "info";
export type DashboardAlertType =
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DUE_SOON"
  | "PROJECT_DELIVERY_SOON"
  | "PROJECT_OVER_CONTRACTED"
  | "TASK_OVERDUE"
  | "VISIT_DUE_SOON";

export type DashboardAlert = {
  id: string;
  type: DashboardAlertType;
  severity: DashboardAlertSeverity;
  title: string;
  message: string;
  amount?: string;
  count?: number;
  targetId?: string;
  targetType?: "project";
};

export type DashboardProjectStatusCount = {
  status: string;
  label: string;
  count: number;
};

export type DashboardDelivery = {
  id: string;
  name: string;
  clientName: string;
  expectedDeliveryDate: string;
  status: string;
  progress: number;
};

export type DashboardPaymentDetail = {
  id: string;
  description: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  dueDate: string;
  status: string;
  statusLabel: string;
};

export type DashboardTaskDetail = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  projectId: string | null;
  projectName: string | null;
  clientId: string | null;
  clientName: string | null;
  criticalReason: string;
};

export type DashboardVisitDetail = {
  id: string;
  type: string;
  typeLabel: string;
  status: string;
  statusLabel: string;
  date: string;
  time: string | null;
  address: string | null;
  amount: string;
  clientId: string;
  clientName: string;
  projectId: string | null;
  projectName: string | null;
};

export type DashboardSummary = {
  generatedAt: string;
  metrics: {
    clientsTotal: number;
    activeProjects: number;
    projectsInProgress: number;
    overduePayments: number;
    dueSoonPayments: number;
  };
  financial: FinancialSummary;
  projects: {
    total: number;
    active: number;
    finished: number;
    cancelled: number;
    averageProgress: number;
    byStatus: DashboardProjectStatusCount[];
    nextDeliveries: DashboardDelivery[];
  };
  operations: {
    tasksTotal: number;
    openTasks: number;
    overdueTasks: number;
    tasksDueSoon: number;
    scheduledVisits: number;
    visitsToday: number;
    visitsNextSevenDays: number;
    openBudgets: number;
  };
  alerts: DashboardAlert[];
  details: {
    overduePayments: DashboardPaymentDetail[];
    dueSoonPayments: DashboardPaymentDetail[];
    criticalTasks: DashboardTaskDetail[];
    upcomingVisits: DashboardVisitDetail[];
  };
};
