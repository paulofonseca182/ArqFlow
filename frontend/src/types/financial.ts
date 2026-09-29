export const paymentStatusValues = ["RECEIVABLE", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"] as const;
export const paymentMethodValues = ["CASH", "PIX", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "BOLETO", "OTHER"] as const;
export const paymentSourceValues = ["PROJECT", "VISIT"] as const;
export const expenseStatusValues = ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"] as const;
export const expenseEntryTypeValues = ["SINGLE", "PURCHASE", "INSTALLMENT"] as const;
export const expenseClassificationValues = ["OPERATIONAL_EXPENSE", "ASSET_PURCHASE", "PROJECT_COST", "OTHER"] as const;
export const financialCategoryTypeValues = ["REVENUE", "EXPENSE"] as const;
export const cashMovementTypeValues = ["INCOME", "EXPENSE"] as const;
export const cashMovementOriginValues = ["RECEIVABLE_PAYMENT", "EXPENSE_PAYMENT", "VISIT_PAYMENT", "MANUAL_ENTRY", "MANUAL_EXIT"] as const;

export type PaymentStatus = (typeof paymentStatusValues)[number];
export type PaymentMethod = (typeof paymentMethodValues)[number];
export type PaymentSource = (typeof paymentSourceValues)[number];
export type ExpenseStatus = (typeof expenseStatusValues)[number];
export type ExpenseEntryType = (typeof expenseEntryTypeValues)[number];
export type ExpenseClassification = (typeof expenseClassificationValues)[number];
export type FinancialCategoryType = (typeof financialCategoryTypeValues)[number];
export type CashMovementType = (typeof cashMovementTypeValues)[number];
export type CashMovementOrigin = (typeof cashMovementOriginValues)[number];

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
  visitId: string | null;
  categoryId: string | null;
  cashAccountId: string | null;
  source: PaymentSource;
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
  category: FinancialCategorySummary | null;
  cashAccount: CashAccountSummary | null;
};

export type FinancialCategorySummary = {
  id: string;
  name: string;
  type: FinancialCategoryType | string;
};

export type CashAccountSummary = {
  id: string;
  name: string;
  type: string;
};

export type FinancialCategory = FinancialCategorySummary & {
  costCenter: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CashAccount = CashAccountSummary & {
  openingBalance: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectFinancial = {
  id: string;
  name: string;
  contractedAmount: string;
  scheduledAmount: string;
  receivedAmount: string;
  pendingAmount: string;
  overdueAmount: string;
  contractDifferenceAmount: string;
  overContractedAmount: string;
  underContractedAmount: string;
  hasContractMismatchAlert: boolean;
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

export type ReorganizeInstallmentInput = {
  id?: string;
  description: string;
  amount: number;
  installment?: number;
  dueDate: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
};

export type ReorganizeInstallmentsInput = {
  installments: ReorganizeInstallmentInput[];
};

export type ReorganizeInstallmentsResult = GenerateInstallmentsResult;

export type FinancialSummary = {
  revenueMonth: string;
  revenueYear: string;
  receivableAmount: string;
  receivedAmount: string;
  expectedRevenueMonth: string;
  expectedRevenueYear: string;
  expectedExpenseMonth: string;
  expectedExpenseYear: string;
  paidExpenseMonth: string;
  paidExpenseYear: string;
  payableExpenseAmount: string;
  overdueExpenseAmount: string;
  dueSoonExpenseAmount: string;
  overdueExpenseCount: number;
  dueSoonExpenseCount: number;
  expectedBalanceMonth: string;
  realizedBalanceMonth: string;
  cashBalance: string;
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
  expenseStatuses: FinancialOption<ExpenseStatus>[];
  expenseEntryTypes: FinancialOption<ExpenseEntryType>[];
  expenseClassifications: FinancialOption<ExpenseClassification>[];
  categoryTypes: FinancialOption<FinancialCategoryType>[];
  cashMovementTypes: FinancialOption<CashMovementType>[];
  cashMovementOrigins: FinancialOption<CashMovementOrigin>[];
  cashAccountTypes: FinancialOption<string>[];
  categories: FinancialCategory[];
  cashAccounts: CashAccount[];
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

export type PaymentUpdateInput = Omit<PaymentWriteInput, "amount" | "projectId">;

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

export type Expense = {
  id: string;
  parentExpenseId: string | null;
  projectId: string | null;
  clientId: string | null;
  categoryId: string | null;
  cashAccountId: string | null;
  entryType: ExpenseEntryType;
  classification: ExpenseClassification;
  description: string;
  supplier: string | null;
  costCenter: string | null;
  amount: string;
  paidAmount: string;
  pendingAmount: string;
  dueDate: string | null;
  purchaseDate: string | null;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  status: ExpenseStatus;
  storedStatus: ExpenseStatus;
  installmentNumber: number | null;
  installmentCount: number | null;
  recurring: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  category: FinancialCategorySummary | null;
  cashAccount: CashAccountSummary | null;
  client: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  payments: ExpensePayment[];
  installments: Expense[];
};

export type ExpensePayment = {
  id: string;
  amount: string;
  paidAt: string;
  paymentMethod: PaymentMethod | null;
  cashAccountId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cashAccount: CashAccountSummary | null;
  cashMovement: {
    id: string;
    date: string;
    amount: string;
  } | null;
};

export type ExpenseInstallmentWriteInput = {
  id?: string;
  description?: string;
  amount: number;
  dueDate: string;
  installmentNumber?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
};

export type ExpenseWriteInput = {
  projectId?: string;
  clientId?: string;
  categoryId?: string;
  cashAccountId?: string;
  entryType?: ExpenseEntryType;
  classification?: ExpenseClassification;
  description: string;
  supplier?: string;
  costCenter?: string;
  amount: number;
  dueDate?: string;
  purchaseDate?: string;
  paymentMethod?: PaymentMethod;
  recurring?: boolean;
  notes?: string;
  installments?: ExpenseInstallmentWriteInput[];
};

export type ExpenseUpdateInput = Partial<ExpenseWriteInput>;

export type PayExpenseInput = {
  paidAmount?: number;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  cashAccountId?: string;
  notes?: string;
};

export type ReorganizeExpenseInstallmentsInput = {
  installments: ExpenseInstallmentWriteInput[];
};

export type CashMovement = {
  id: string;
  paymentId: string | null;
  expenseId: string | null;
  expensePaymentId: string | null;
  visitId: string | null;
  clientId: string | null;
  projectId: string | null;
  categoryId: string | null;
  cashAccountId: string | null;
  type: CashMovementType;
  date: string;
  description: string;
  amount: string;
  paymentMethod: PaymentMethod | null;
  origin: CashMovementOrigin;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  category: FinancialCategorySummary | null;
  cashAccount: CashAccountSummary | null;
  client: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
};

export type ManualCashMovementInput = {
  type: CashMovementType;
  date: string;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  categoryId?: string;
  cashAccountId?: string;
  clientId?: string;
  projectId?: string;
  notes?: string;
};

export type CashSummary = {
  openingBalance: string;
  incomeAmount: string;
  expenseAmount: string;
  balance: string;
};

export type CashFlowSummary = {
  period: {
    from: string;
    to: string;
  };
  expectedIncome: string;
  expectedExpense: string;
  expectedBalance: string;
  realizedIncome: string;
  realizedExpense: string;
  realizedBalance: string;
  difference: string;
  overdueReceivablesAmount: string;
  overdueReceivablesCount: number;
  overdueExpensesAmount: string;
  overdueExpensesCount: number;
};
