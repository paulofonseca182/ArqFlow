import { api } from "./api";
import type { ApiSuccess, PaginatedResponse } from "../types/api";
import type {
  FinancialMeta,
  FinancialSummary,
  GenerateInstallmentsInput,
  GenerateInstallmentsResult,
  Payment,
  PaymentMethod,
  PaymentMutationResult,
  PaymentStatus,
  PaymentUpdateInput,
  PaymentWriteInput,
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

export type { PaymentMethod, PaymentStatus };
