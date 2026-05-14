import { api } from "./api";
import type { ApiSuccess, PaginatedResponse } from "../types/api";
import type { Visit, VisitOption, VisitStatus, VisitType, VisitWriteInput } from "../types/visit";

type VisitsMeta = {
  statuses: VisitOption<VisitStatus>[];
  types: VisitOption<VisitType>[];
};

type ListVisitsParams = {
  page: number;
  pageSize: number;
  search?: string;
  clientId?: string;
  projectId?: string;
  type?: VisitType;
  status?: VisitStatus;
  dateFrom?: string;
  dateTo?: string;
};

export async function getVisitsMeta() {
  const response = await api.get<ApiSuccess<VisitsMeta>>("/visits/meta");

  return response.data.data;
}

export async function listVisits(params: ListVisitsParams) {
  const response = await api.get<PaginatedResponse<Visit>>("/visits", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      clientId: params.clientId || undefined,
      projectId: params.projectId || undefined,
      type: params.type || undefined,
      status: params.status || undefined,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined
    }
  });

  return response.data;
}

export async function createVisit(payload: VisitWriteInput) {
  const response = await api.post<ApiSuccess<Visit>>("/visits", payload);

  return response.data.data;
}

export async function updateVisit(id: string, payload: VisitWriteInput) {
  const response = await api.patch<ApiSuccess<Visit>>(`/visits/${id}`, payload);

  return response.data.data;
}

export async function completeVisit(id: string) {
  const response = await api.patch<ApiSuccess<Visit>>(`/visits/${id}/complete`);

  return response.data.data;
}

export async function reopenVisit(id: string) {
  const response = await api.patch<ApiSuccess<Visit>>(`/visits/${id}/reopen`);

  return response.data.data;
}

export async function cancelVisit(id: string) {
  const response = await api.patch<ApiSuccess<Visit>>(`/visits/${id}/cancel`);

  return response.data.data;
}

export async function deleteVisit(id: string) {
  const response = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/visits/${id}`);

  return response.data.data;
}
