import type { FinancialSummary } from "./financial";

export type DashboardAlertSeverity = "danger" | "warning" | "info";
export type DashboardAlertType = "PAYMENT_OVERDUE" | "PAYMENT_DUE_SOON" | "PROJECT_DELIVERY_SOON" | "PROJECT_OVER_CONTRACTED";

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
  alerts: DashboardAlert[];
};
