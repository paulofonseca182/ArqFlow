import { api } from "./api";
import type { ApiSuccess, PaginatedResponse } from "../types/api";
import type { Budget, BudgetOption, BudgetStatus, BudgetWriteInput } from "../types/budget";

type BudgetsMeta = {
  statuses: BudgetOption<BudgetStatus>[];
};

type ListBudgetsParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: BudgetStatus;
  clientId?: string;
  projectId?: string;
};

export async function listBudgets(params: ListBudgetsParams) {
  const response = await api.get<PaginatedResponse<Budget>>("/budgets", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      clientId: params.clientId || undefined,
      projectId: params.projectId || undefined
    }
  });

  return response.data;
}

export async function getBudgetsMeta() {
  const response = await api.get<ApiSuccess<BudgetsMeta>>("/budgets/meta");

  return response.data.data;
}

export async function createBudget(payload: BudgetWriteInput) {
  const response = await api.post<ApiSuccess<Budget>>("/budgets", payload);

  return response.data.data;
}

export async function updateBudget(id: string, payload: BudgetWriteInput) {
  const response = await api.patch<ApiSuccess<Budget>>(`/budgets/${id}`, payload);

  return response.data.data;
}

export async function sendBudget(id: string) {
  const response = await api.patch<ApiSuccess<Budget>>(`/budgets/${id}/send`);

  return response.data.data;
}

export async function deleteBudget(id: string) {
  const response = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/budgets/${id}`);

  return response.data.data;
}
