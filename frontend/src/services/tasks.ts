import { api } from "./api";
import type { ApiSuccess, PaginatedResponse } from "../types/api";
import type { Task, TaskOption, TaskPriority, TaskStatus, TaskWriteInput } from "../types/task";

type TasksMeta = {
  statuses: TaskOption<TaskStatus>[];
  priorities: TaskOption<TaskPriority>[];
};

type ListTasksParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  dueFrom?: string;
  dueTo?: string;
  overdue?: boolean;
  scope?: "OVERDUE_TASKS" | "DUE_SOON_TASKS";
};

export async function getTasksMeta() {
  const response = await api.get<ApiSuccess<TasksMeta>>("/tasks/meta");

  return response.data.data;
}

export async function listTasks(params: ListTasksParams) {
  const response = await api.get<PaginatedResponse<Task>>("/tasks", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      status: params.status || undefined,
      priority: params.priority || undefined,
      projectId: params.projectId || undefined,
      dueFrom: params.dueFrom || undefined,
      dueTo: params.dueTo || undefined,
      overdue: params.overdue || undefined,
      scope: params.scope || undefined
    }
  });

  return response.data;
}

export async function createTask(payload: TaskWriteInput) {
  const response = await api.post<ApiSuccess<Task>>("/tasks", payload);

  return response.data.data;
}

export async function updateTask(id: string, payload: TaskWriteInput) {
  const response = await api.patch<ApiSuccess<Task>>(`/tasks/${id}`, payload);

  return response.data.data;
}

export async function completeTask(id: string) {
  const response = await api.patch<ApiSuccess<Task>>(`/tasks/${id}/complete`);

  return response.data.data;
}

export async function reopenTask(id: string) {
  const response = await api.patch<ApiSuccess<Task>>(`/tasks/${id}/reopen`);

  return response.data.data;
}

export async function cancelTask(id: string) {
  const response = await api.patch<ApiSuccess<Task>>(`/tasks/${id}/cancel`);

  return response.data.data;
}

export async function deleteTask(id: string) {
  const response = await api.delete<ApiSuccess<{ deleted: boolean }>>(`/tasks/${id}`);

  return response.data.data;
}
