import { z } from "zod";
import { stepStatuses } from "../../shared/domain.js";

const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));

export const projectStepIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const listProjectStepsQuerySchema = z.object({
  projectId: z.string().cuid()
});

export const generateDefaultProjectStepsSchema = z.object({
  projectId: z.string().cuid()
});

export const updateProjectStepSchema = z
  .object({
    name: z.string().trim().min(2, "nome deve ter pelo menos 2 caracteres").optional(),
    description: optionalText,
    sortOrder: z.coerce.number().int().positive().optional(),
    startsAt: optionalDate,
    dueDate: optionalDate,
    status: z.enum(stepStatuses).optional(),
    notes: optionalText
  })
  .superRefine((data, context) => {
    if (data.startsAt && data.dueDate && data.dueDate < data.startsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "data prevista não pode ser anterior ao início da etapa"
      });
    }
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export type ListProjectStepsQuery = z.infer<typeof listProjectStepsQuerySchema>;
export type GenerateDefaultProjectStepsInput = z.infer<typeof generateDefaultProjectStepsSchema>;
export type UpdateProjectStepInput = z.infer<typeof updateProjectStepSchema>;
