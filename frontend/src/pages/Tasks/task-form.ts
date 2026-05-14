import { z } from "zod";
import { taskPriorityValues, taskStatusValues } from "../../types/task";
import type { Task, TaskWriteInput } from "../../types/task";

export type TaskFormFields = {
  projectId: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: (typeof taskPriorityValues)[number];
  status: (typeof taskStatusValues)[number];
  notes: string;
};

const optionalText = z.string().trim().transform((value) => value || undefined);
const optionalProjectId = z.string().trim().transform((value) => value || null);
const optionalDate = z.string().trim().transform((value) => value || undefined);

export const taskFormSchema = z.object({
  projectId: optionalProjectId,
  title: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
  description: optionalText,
  assignee: optionalText,
  dueDate: optionalDate,
  priority: z.enum(taskPriorityValues),
  status: z.enum(taskStatusValues),
  notes: optionalText
});

export type TaskFormPayload = z.infer<typeof taskFormSchema>;

export function getTaskFormDefaults(task?: Task | null): TaskFormFields {
  return {
    projectId: task?.projectId ?? "",
    title: task?.title ?? "",
    description: task?.description ?? "",
    assignee: task?.assignee ?? "",
    dueDate: toDateInputValue(task?.dueDate),
    priority: task?.priority ?? "MEDIUM",
    status: task?.status ?? "PENDING",
    notes: task?.notes ?? ""
  };
}

export function normalizeTaskPayload(data: TaskFormPayload): TaskWriteInput {
  return {
    projectId: data.projectId,
    title: data.title.trim(),
    description: data.description,
    assignee: data.assignee,
    dueDate: data.dueDate,
    priority: data.priority,
    status: data.status,
    notes: data.notes
  };
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}
