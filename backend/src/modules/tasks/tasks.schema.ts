import { z } from "zod";
import { paginationQuerySchema } from "../../shared/pagination.js";
import { taskPriorities, taskStatuses } from "../../shared/domain.js";

const taskScopeValues = ["OVERDUE_TASKS", "DUE_SOON_TASKS"] as const;
const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));
const optionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["true", "1"].includes(normalizedValue)) {
      return true;
    }

    if (["false", "0"].includes(normalizedValue)) {
      return false;
    }
  }

  return value;
}, z.boolean().optional());
const optionalProjectId = z
  .string()
  .cuid("projeto inválido")
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

export const taskIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const listTasksQuerySchema = paginationQuerySchema
  .extend({
    projectId: z.string().cuid().optional(),
    status: z.enum(taskStatuses).optional(),
    priority: z.enum(taskPriorities).optional(),
    dueFrom: optionalDate,
    dueTo: optionalDate,
    overdue: optionalBoolean,
    scope: z.enum(taskScopeValues).optional()
  })
  .superRefine(validateDueDateRange);

const taskBaseSchema = z.object({
  projectId: optionalProjectId,
  title: z.string().trim().min(2, "título deve ter pelo menos 2 caracteres"),
  description: optionalText,
  assignee: optionalText,
  dueDate: optionalDate,
  priority: z.enum(taskPriorities).default("MEDIUM"),
  status: z.enum(taskStatuses).default("PENDING"),
  notes: optionalText
});

export const createTaskSchema = taskBaseSchema;

export const updateTaskSchema = taskBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

function validateDueDateRange(data: { dueFrom?: Date; dueTo?: Date }, context: z.RefinementCtx) {
  if (data.dueFrom && data.dueTo && data.dueTo < data.dueFrom) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueTo"],
      message: "data final não pode ser anterior à data inicial"
    });
  }
}
