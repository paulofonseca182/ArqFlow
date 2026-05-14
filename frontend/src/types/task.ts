export const taskStatusValues = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskStatus = (typeof taskStatusValues)[number];
export type TaskPriority = (typeof taskPriorityValues)[number];

export type TaskOption<T extends string> = {
  value: T;
  label: string;
};

export type TaskProjectSummary = {
  id: string;
  name: string;
  status: string;
  client: {
    id: string;
    name: string;
  };
};

export type Task = {
  id: string;
  projectId: string | null;
  title: string;
  description: string | null;
  assignee: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  project: TaskProjectSummary | null;
};

export type TaskWriteInput = {
  projectId?: string | null;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
};
