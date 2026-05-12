import { api } from "./api";
import type { ApiSuccess } from "../types/api";
import type { ProjectOption, ProjectType } from "../types/project";
import type { ProjectStep, ProjectStepsResponse, ProjectStepStatus, ProjectStepTemplate } from "../types/projectStep";

type ProjectStepsMeta = {
  statuses: ProjectOption<ProjectStepStatus>[];
  templates: Array<{
    type: ProjectType;
    steps: ProjectStepTemplate[];
  }>;
};

export async function getProjectStepsMeta() {
  const response = await api.get<ApiSuccess<ProjectStepsMeta>>("/project-steps/meta");

  return response.data.data;
}

export async function listProjectSteps(projectId: string) {
  const response = await api.get<ProjectStepsResponse>("/project-steps", {
    params: { projectId }
  });

  return response.data;
}

export async function generateDefaultProjectSteps(projectId: string) {
  const response = await api.post<ApiSuccess<ProjectStepsResponse>>("/project-steps/generate-defaults", { projectId });

  return response.data.data;
}

export async function completeProjectStep(id: string) {
  const response = await api.patch<ApiSuccess<ProjectStep>>(`/project-steps/${id}/complete`);

  return response.data.data;
}

export async function reopenProjectStep(id: string) {
  const response = await api.patch<ApiSuccess<ProjectStep>>(`/project-steps/${id}/reopen`);

  return response.data.data;
}
