export const projectStepStatusValues = ["PENDING", "IN_PROGRESS", "WAITING_CLIENT", "IN_REVIEW", "COMPLETED", "CANCELLED"] as const;

export type ProjectStepStatus = (typeof projectStepStatusValues)[number];

export type ProjectStep = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  startsAt: string | null;
  dueDate: string | null;
  completedAt: string | null;
  status: ProjectStepStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStepsResponse = {
  data: ProjectStep[];
  progress: number;
};

export type ProjectStepTemplate = {
  name: string;
  description?: string;
  sortOrder: number;
};
