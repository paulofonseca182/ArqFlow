import { z } from "zod";
import { visitStatuses, visitTypes } from "../../shared/domain.js";
import { paginationQuerySchema } from "../../shared/pagination.js";

const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));
const requiredDate = z.coerce.date({ invalid_type_error: "data inválida" });
const optionalProjectId = z
  .string()
  .cuid("projeto inválido")
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));
const optionalPositiveNumber = z.preprocess(
  parseOptionalNumberInput,
  z.number().positive("valor deve ser maior que zero").optional()
);
const optionalTime = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "horário deve estar no formato HH:mm")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const visitIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const listVisitsQuerySchema = paginationQuerySchema
  .extend({
    clientId: z.string().cuid().optional(),
    projectId: z.string().cuid().optional(),
    type: z.enum(visitTypes).optional(),
    status: z.enum(visitStatuses).optional(),
    dateFrom: optionalDate,
    dateTo: optionalDate
  })
  .superRefine(validateVisitDateRange);

const visitBaseSchema = z.object({
  clientId: z.string().cuid("cliente inválido"),
  projectId: optionalProjectId,
  type: z.enum(visitTypes),
  date: requiredDate,
  time: optionalTime,
  address: optionalText,
  amount: optionalPositiveNumber,
  status: z.enum(visitStatuses).default("SCHEDULED"),
  notes: optionalText
});

export const createVisitSchema = visitBaseSchema;

export const updateVisitSchema = visitBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export type ListVisitsQuery = z.infer<typeof listVisitsQuerySchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;

function parseOptionalNumberInput(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return Number(value.replace(/\./g, "").replace(",", "."));
  }

  return value;
}

function validateVisitDateRange(data: { dateFrom?: Date; dateTo?: Date }, context: z.RefinementCtx) {
  if (data.dateFrom && data.dateTo && data.dateTo < data.dateFrom) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateTo"],
      message: "data final não pode ser anterior à data inicial"
    });
  }
}
