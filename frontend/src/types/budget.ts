export const budgetStatusValues = ["DRAFT", "SENT", "NEGOTIATION", "APPROVED", "REFUSED", "EXPIRED", "CANCELLED"] as const;

export type BudgetStatus = (typeof budgetStatusValues)[number];

export type BudgetOption<T extends string = BudgetStatus> = {
  value: T;
  label: string;
};

export type BudgetClientSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export type BudgetProjectSummary = {
  id: string;
  name: string;
  status: string;
};

export type BudgetItem = {
  id: string;
  budgetId: string;
  description: string;
  quantity: string;
  unitAmount: string;
  totalAmount: string;
};

export type Budget = {
  id: string;
  clientId: string;
  projectId: string | null;
  title: string;
  serviceType: string;
  description: string | null;
  totalAmount: string;
  discount: string;
  finalAmount: string;
  paymentMethod: string | null;
  expiresAt: string | null;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
  client: BudgetClientSummary;
  project: BudgetProjectSummary | null;
  items: BudgetItem[];
};

export type BudgetWriteItemInput = {
  description: string;
  quantity: number;
  unitAmount: number;
};

export type BudgetWriteInput = {
  clientId: string;
  projectId?: string | null;
  title: string;
  serviceType: string;
  description?: string;
  discount: number;
  paymentMethod?: string;
  expiresAt?: string;
  status: BudgetStatus;
  items: BudgetWriteItemInput[];
};
