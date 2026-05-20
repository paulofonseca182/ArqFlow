import { api } from "./api";
import type { ApiSuccess, PaginatedResponse } from "../types/api";
import type {
  Project,
  ProjectDeleteImpact,
  ManualProjectReason,
  ProjectOption,
  ProjectOrigin,
  ProjectStatus,
  ProjectType,
  ProjectWriteInput
} from "../types/project";

type ProjectsMeta = {
  statuses: ProjectOption<ProjectStatus>[];
  types: ProjectOption<ProjectType>[];
  origins: ProjectOption<ProjectOrigin>[];
  manualReasons: ProjectOption<ManualProjectReason>[];
};

type ListProjectsParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: ProjectStatus;
  type?: ProjectType;
  origin?: ProjectOrigin;
  clientId?: string;
};

export async function listProjects(params: ListProjectsParams) {
  const response = await api.get<PaginatedResponse<Project>>("/projects", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      type: params.type || undefined,
      origin: params.origin || undefined,
      clientId: params.clientId || undefined
    }
  });

  return response.data;
}

export async function getProjectsMeta() {
  const response = await api.get<ApiSuccess<ProjectsMeta>>("/projects/meta");

  return response.data.data;
}

export async function createProject(payload: ProjectWriteInput) {
  const response = await api.post<ApiSuccess<Project>>("/projects", payload);

  return response.data.data;
}

export async function updateProject(id: string, payload: ProjectWriteInput) {
  const response = await api.patch<ApiSuccess<Project>>(`/projects/${id}`, payload);

  return response.data.data;
}

export async function getProjectDeleteImpact(id: string) {
  const response = await api.get<ApiSuccess<ProjectDeleteImpact>>(`/projects/${id}/delete-impact`);

  return response.data.data;
}

export async function deleteProject(id: string) {
  const response = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/projects/${id}`);

  return response.data.data;
}
