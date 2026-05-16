export type ReportStatusCount = {
  status: string;
  label: string;
  count: number;
  percentage: number;
};

export type ReportPeriodKey = "CURRENT_MONTH" | "CURRENT_YEAR" | "CUSTOM";

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
