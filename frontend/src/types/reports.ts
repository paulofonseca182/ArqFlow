export type ReportStatusCount = {
  status: string;
  label: string;
  count: number;
  percentage: number;
};

export const reportPeriodValues = ["CURRENT_MONTH", "CURRENT_YEAR", "CUSTOM"] as const;

export type ReportPeriodKey = (typeof reportPeriodValues)[number];

export type ReportPeriod = {
  key: ReportPeriodKey;
  label: string;
  from: string;
  to: string;
};

export type ReportsOverviewParams = {
  period: ReportPeriodKey;
  from?: string;
  to?: string;
  clientId?: string;
  projectId?: string;
};

export type ReportsOverviewFilters = {
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
};

export type ReportsFinancialSummary = {
  receivedAmount: string;
  receivableAmount: string;
  overdueAmount: string;
  dueSoonAmount: string;
  paidPayments: number;
  receivablePayments: number;
  overduePayments: number;
  dueSoonPayments: number;
  averageProjectTicket: string;
};

export type ReportProjectReceivable = {
  id: string;
  name: string;
  clientName: string;
  contractedAmount: string;
  receivedAmount: string;
  pendingAmount: string;
  overdueAmount: string;
};

export type ReportPaymentDetail = {
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

export type ReportTaskDetail = {
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

export type ReportVisitDetail = {
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

export type ReportsOverview = {
  filters: ReportsOverviewFilters;
  generatedAt: string;
  period: ReportPeriod;
  clients: {
    total: number;
    active: number;
    byStatus: ReportStatusCount[];
  };
  commercial: {
    totalBudgets: number;
    openBudgets: number;
    approvedBudgets: number;
    refusedBudgets: number;
    conversionRate: number;
    approvedAmount: string;
    openAmount: string;
    byStatus: ReportStatusCount[];
  };
  financial: ReportsFinancialSummary;
  projects: {
    total: number;
    active: number;
    finished: number;
    cancelled: number;
    totalContractedAmount: string;
    budgetOriginProjects: number;
    manualProjects: number;
    averageProgress: number;
    byStatus: ReportStatusCount[];
    byOrigin: ReportStatusCount[];
    byType: ReportStatusCount[];
    topReceivableProjects: ReportProjectReceivable[];
  };
  operations: {
    tasksTotal: number;
    openTasks: number;
    overdueTasks: number;
    dueSoonTasks: number;
    urgentTasks: number;
    scheduledVisits: number;
    completedVisits: number;
    visitsNextSevenDays: number;
    visitsAmount: string;
    byTaskStatus: ReportStatusCount[];
    byTaskPriority: ReportStatusCount[];
    byVisitStatus: ReportStatusCount[];
    byVisitType: ReportStatusCount[];
  };
  details: {
    overduePayments: ReportPaymentDetail[];
    dueSoonPayments: ReportPaymentDetail[];
    criticalTasks: ReportTaskDetail[];
    upcomingVisits: ReportVisitDetail[];
  };
};
