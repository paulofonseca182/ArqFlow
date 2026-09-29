import { api } from "./api";
import type { ApiSuccess, PaginatedResponse } from "../types/api";
import type {
  CashFlowSummary,
  CashMovement,
  CashMovementOrigin,
  CashMovementType,
  CashSummary,
  Expense,
  ExpenseStatus,
  ExpenseUpdateInput,
  ExpenseWriteInput,
  FinancialMeta,
  FinancialSummary,
  GenerateInstallmentsInput,
  GenerateInstallmentsResult,
  ManualCashMovementInput,
  Payment,
  PaymentMethod,
  PaymentMutationResult,
  PaymentStatus,
  PaymentUpdateInput,
  PaymentWriteInput,
  PayExpenseInput,
  ReorganizeExpenseInstallmentsInput,
  ReorganizeInstallmentsInput,
  ReorganizeInstallmentsResult,
  RegisterPaymentInput
} from "../types/financial";

type ListPaymentsParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: PaymentStatus;
  projectId?: string;
  clientId?: string;
  dueFrom?: string;
  dueTo?: string;
};

type ListExpensesParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: ExpenseStatus;
  projectId?: string;
  clientId?: string;
  categoryId?: string;
  cashAccountId?: string;
  dueFrom?: string;
  dueTo?: string;
};

type ListCashMovementsParams = {
  page: number;
  pageSize: number;
  search?: string;
  type?: CashMovementType;
  origin?: CashMovementOrigin;
  projectId?: string;
  clientId?: string;
  categoryId?: string;
  cashAccountId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type CashPeriodParams = {
  from?: string;
  to?: string;
  projectId?: string;
  clientId?: string;
  categoryId?: string;
  cashAccountId?: string;
};

export async function getFinancialMeta() {
  const response = await api.get<ApiSuccess<FinancialMeta>>("/financial/meta");

  return response.data.data;
}

export async function getFinancialSummary() {
  const response = await api.get<ApiSuccess<FinancialSummary>>("/financial/summary");

  return response.data.data;
}

export async function listPayments(params: ListPaymentsParams) {
  const response = await api.get<PaginatedResponse<Payment>>("/financial/payments", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      projectId: params.projectId || undefined,
      clientId: params.clientId || undefined,
      dueFrom: params.dueFrom || undefined,
      dueTo: params.dueTo || undefined
    }
  });

  return response.data;
}

export async function listReceivables(params: ListPaymentsParams) {
  const response = await api.get<PaginatedResponse<Payment>>("/financial/receivables", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      projectId: params.projectId || undefined,
      clientId: params.clientId || undefined,
      dueFrom: params.dueFrom || undefined,
      dueTo: params.dueTo || undefined
    }
  });

  return response.data;
}

export async function listExpenses(params: ListExpensesParams) {
  const response = await api.get<PaginatedResponse<Expense>>("/financial/expenses", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      projectId: params.projectId || undefined,
      clientId: params.clientId || undefined,
      categoryId: params.categoryId || undefined,
      cashAccountId: params.cashAccountId || undefined,
      dueFrom: params.dueFrom || undefined,
      dueTo: params.dueTo || undefined
    }
  });

  return response.data;
}

export async function createExpense(payload: ExpenseWriteInput) {
  const response = await api.post<ApiSuccess<Expense>>("/financial/expenses", payload);

  return response.data.data;
}

export async function updateExpense(id: string, payload: ExpenseUpdateInput) {
  const response = await api.patch<ApiSuccess<Expense>>(`/financial/expenses/${id}`, payload);

  return response.data.data;
}

export async function payExpense(id: string, payload: PayExpenseInput) {
  const response = await api.patch<ApiSuccess<{ expense: Expense; cashSummary: CashSummary }>>(`/financial/expenses/${id}/pay`, payload);

  return response.data.data;
}

export async function reorganizeExpenseInstallments(id: string, payload: ReorganizeExpenseInstallmentsInput) {
  const response = await api.patch<ApiSuccess<Expense>>(`/financial/expenses/${id}/installments`, payload);

  return response.data.data;
}

export async function cancelExpense(id: string) {
  const response = await api.patch<ApiSuccess<Expense>>(`/financial/expenses/${id}/cancel`);

  return response.data.data;
}

export async function deleteExpense(id: string) {
  const response = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/financial/expenses/${id}`);

  return response.data.data;
}

export async function listCashMovements(params: ListCashMovementsParams) {
  const response = await api.get<PaginatedResponse<CashMovement>>("/financial/cash-movements", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      type: params.type || undefined,
      origin: params.origin || undefined,
      projectId: params.projectId || undefined,
      clientId: params.clientId || undefined,
      categoryId: params.categoryId || undefined,
      cashAccountId: params.cashAccountId || undefined,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined
    }
  });

  return response.data;
}

export async function createManualCashMovement(payload: ManualCashMovementInput) {
  const response = await api.post<ApiSuccess<{ movement: CashMovement; cashSummary: CashSummary }>>(
    "/financial/cash-movements/manual",
    payload
  );

  return response.data.data;
}

export async function getCashSummary(params: CashPeriodParams = {}) {
  const response = await api.get<ApiSuccess<CashSummary>>("/financial/cash-summary", {
    params
  });

  return response.data.data;
}

export async function getCashFlow(params: CashPeriodParams = {}) {
  const response = await api.get<ApiSuccess<CashFlowSummary>>("/financial/cash-flow", {
    params
  });

  return response.data.data;
}

export async function createPayment(payload: PaymentWriteInput) {
  const response = await api.post<ApiSuccess<PaymentMutationResult>>("/financial/payments", payload);

  return response.data.data;
}

export async function updatePayment(id: string, payload: PaymentUpdateInput) {
  const response = await api.patch<ApiSuccess<PaymentMutationResult>>(`/financial/payments/${id}`, payload);

  return response.data.data;
}

export async function registerPayment(id: string, payload: RegisterPaymentInput) {
  const response = await api.patch<ApiSuccess<PaymentMutationResult>>(`/financial/payments/${id}/pay`, payload);

  return response.data.data;
}

export async function cancelPayment(id: string) {
  const response = await api.patch<ApiSuccess<Payment>>(`/financial/payments/${id}/cancel`);

  return response.data.data;
}

export async function generateInstallments(payload: GenerateInstallmentsInput) {
  const response = await api.post<ApiSuccess<GenerateInstallmentsResult>>("/financial/installments", payload);

  return response.data.data;
}

export async function reorganizeInstallments(projectId: string, payload: ReorganizeInstallmentsInput) {
  const response = await api.patch<ApiSuccess<ReorganizeInstallmentsResult>>(
    `/financial/projects/${projectId}/installments`,
    payload
  );

  return response.data.data;
}

export type { PaymentMethod, PaymentStatus };
