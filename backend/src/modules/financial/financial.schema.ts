import { z } from "zod";
import { paymentMethods, paymentStatuses } from "../../shared/domain.js";
import { paginationQuerySchema } from "../../shared/pagination.js";

const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));
const requiredDate = z.coerce.date({ invalid_type_error: "data inválida" });
const positiveNumber = z.preprocess(parseNumberInput, z.number().positive("valor deve ser maior que zero"));
const optionalPositiveNumber = z.preprocess(
  parseOptionalNumberInput,
  z.number().positive("valor deve ser maior que zero").optional()
);

export const paymentIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const listPaymentsQuerySchema = paginationQuerySchema
  .extend({
    clientId: z.string().cuid().optional(),
    projectId: z.string().cuid().optional(),
    status: z.enum(paymentStatuses).optional(),
    dueFrom: optionalDate,
    dueTo: optionalDate
  })
  .superRefine(validateDueDateRange);

export const createPaymentSchema = z.object({
  projectId: z.string().cuid("projeto inválido"),
  description: z.string().trim().min(2, "descrição deve ter pelo menos 2 caracteres"),
  amount: positiveNumber,
  installment: z.coerce.number().int().positive("parcela deve ser maior que zero").optional(),
  dueDate: requiredDate,
  paymentMethod: z.enum(paymentMethods).optional(),
  notes: optionalText
});

export const updatePaymentSchema = createPaymentSchema
  .omit({ projectId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export const registerPaymentSchema = z.object({
  paidAmount: optionalPositiveNumber,
  paidAt: optionalDate
});

export const generateInstallmentsSchema = z.object({
  projectId: z.string().cuid("projeto inválido"),
  installments: z.coerce.number().int().min(1).max(3),
  firstDueDate: requiredDate,
  paymentMethod: z.enum(paymentMethods).optional(),
  description: optionalText,
  notes: optionalText
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
export type GenerateInstallmentsInput = z.infer<typeof generateInstallmentsSchema>;

function parseNumberInput(value: unknown) {
  if (typeof value === "string") {
    return Number(value.replace(/\./g, "").replace(",", "."));
  }

  return value;
}

function parseOptionalNumberInput(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return parseNumberInput(value);
}

function validateDueDateRange(data: { dueFrom?: Date; dueTo?: Date }, context: z.RefinementCtx) {
  if (data.dueFrom && data.dueTo && data.dueTo < data.dueFrom) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueTo"],
      message: "data final não pode ser anterior à data inicial"
    });
  }
}
