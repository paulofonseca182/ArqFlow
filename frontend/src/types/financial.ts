export const paymentStatusValues = ["RECEIVABLE", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"] as const;
export const paymentMethodValues = ["CASH", "PIX", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "BOLETO", "OTHER"] as const;

export type PaymentStatus = (typeof paymentStatusValues)[number];
export type PaymentMethod = (typeof paymentMethodValues)[number];

export type FinancialOption<T extends string> = {
  value: T;
  label: string;
};

export type PaymentClientSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export type PaymentProjectSummary = {
  id: string;
  name: string;
  status: string;
  contractedAmount: string | null;
};

export type Payment = {
  id: string;
  projectId: string;
  clientId: string;
  description: string;
  amount: string;
  paidAmount: string;
  installment: number | null;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  status: PaymentStatus;
  storedStatus: PaymentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: PaymentClientSummary;
  project: PaymentProjectSummary;
};

export type ProjectFinancial = {
  id: string;
  name: string;
  contractedAmount: string;
  scheduledAmount: string;
  receivedAmount: string;
  pendingAmount: string;
  overdueAmount: string;
  overContractedAmount: string;
  hasOverContractedAlert: boolean;
};

export type FinancialAlert = {
  code: string;
  message: string;
  amount: string;
} | null;

export type PaymentMutationResult = {
  payment: Payment;
  projectFinancial: ProjectFinancial;
  alert: FinancialAlert;
};

export type GenerateInstallmentsResult = {
  payments: Payment[];
  projectFinancial: ProjectFinancial;
  alert: FinancialAlert;
};

export type FinancialSummary = {
  revenueMonth: string;
  revenueYear: string;
  receivableAmount: string;
  receivedAmount: string;
  overdueAmount: string;
  dueSoonAmount: string;
  overdueCount: number;
  dueSoonCount: number;
  approvedBudgets: number;
  refusedBudgets: number;
  averageProjectTicket: string;
};

export type FinancialMeta = {
  statuses: FinancialOption<PaymentStatus>[];
  methods: FinancialOption<PaymentMethod>[];
};

export type PaymentWriteInput = {
  projectId: string;
  description: string;
  amount: number;
  installment?: number;
  dueDate: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
};

export type PaymentUpdateInput = Omit<PaymentWriteInput, "projectId">;

export type RegisterPaymentInput = {
  paidAmount?: number;
  paidAt?: string;
};

export type GenerateInstallmentsInput = {
  projectId: string;
  installments: number;
  firstDueDate: string;
  paymentMethod?: PaymentMethod;
  description?: string;
  notes?: string;
};
