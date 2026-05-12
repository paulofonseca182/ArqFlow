import { api } from "./api";
import type { ApiSuccess, PaginatedResponse } from "../types/api";
import type { Client, ClientDeleteImpact, ClientStatus, ClientStatusOption, ClientWriteInput } from "../types/client";

type ClientsMeta = {
  statuses: ClientStatusOption[];
};

type ListClientsParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: ClientStatus;
};

export async function listClients(params: ListClientsParams) {
  const response = await api.get<PaginatedResponse<Client>>("/clients", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined
    }
  });

  return response.data;
}

export async function getClientsMeta() {
  const response = await api.get<ApiSuccess<ClientsMeta>>("/clients/meta");

  return response.data.data;
}

export async function createClient(payload: ClientWriteInput) {
  const response = await api.post<ApiSuccess<Client>>("/clients", payload);

  return response.data.data;
}

export async function updateClient(id: string, payload: ClientWriteInput) {
  const response = await api.patch<ApiSuccess<Client>>(`/clients/${id}`, payload);

  return response.data.data;
}

export async function getClientDeleteImpact(id: string) {
  const response = await api.get<ApiSuccess<ClientDeleteImpact>>(`/clients/${id}/delete-impact`);

  return response.data.data;
}

export async function deleteClient(id: string) {
  const response = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/clients/${id}`);

  return response.data.data;
}
