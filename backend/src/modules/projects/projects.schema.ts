import { z } from "zod";
import { projectStatuses, projectTypes } from "../../shared/domain.js";
import { paginationQuerySchema } from "../../shared/pagination.js";

const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));
const optionalPositiveNumber = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === "string") {
      return Number(value.replace(",", "."));
    }

    return value;
  }, z.number().positive("valor deve ser maior que zero").optional());

export const projectIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  clientId: z.string().cuid().optional(),
  status: z.enum(projectStatuses).optional(),
  type: z.enum(projectTypes).optional()
});

const projectBaseSchema = z.object({
  clientId: z.string().cuid("cliente inválido"),
  name: z.string().trim().min(2, "nome deve ter pelo menos 2 caracteres"),
  type: z.enum(projectTypes),
  status: z.enum(projectStatuses).default("CONTRACT_IN_PROGRESS"),
  workAddress: optionalText,
  area: optionalPositiveNumber,
  contractedAmount: optionalPositiveNumber,
  startsAt: optionalDate,
  expectedDeliveryDate: optionalDate,
  description: optionalText,
  notes: optionalText,
  internalNotes: optionalText,
  pinned: z.boolean().optional()
});

export const createProjectSchema = projectBaseSchema.superRefine(validateProjectDateRange);

export const updateProjectSchema = projectBaseSchema
  .partial()
  .superRefine(validateProjectDateRange)
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

function validateProjectDateRange(data: { startsAt?: Date; expectedDeliveryDate?: Date }, context: z.RefinementCtx) {
  if (data.startsAt && data.expectedDeliveryDate && data.expectedDeliveryDate < data.startsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expectedDeliveryDate"],
      message: "data de entrega não pode ser anterior à data de início"
    });
  }
}
