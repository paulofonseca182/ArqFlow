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
  paidPayments: number;
  receivablePayments: number;
  overduePayments: number;
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
    averageProgress: number;
    byStatus: ReportStatusCount[];
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
};
