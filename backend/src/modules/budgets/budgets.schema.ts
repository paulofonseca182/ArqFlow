import { z } from "zod";
import { budgetStatuses, projectStatuses, projectTypes } from "../../shared/domain.js";
import { paginationQuerySchema } from "../../shared/pagination.js";

const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));
const optionalProjectId = z
  .string()
  .cuid("projeto inválido")
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));

const positiveNumber = z.preprocess(parseNumberInput, z.number().positive("valor deve ser maior que zero"));
const optionalPositiveNumber = z.preprocess(
  parseOptionalNumberInput,
  z.number().positive("valor deve ser maior que zero").optional()
);
const createDiscountNumber = z.preprocess(parseDiscountInputForCreate, z.number().min(0, "desconto não pode ser negativo"));
const updateDiscountNumber = z.preprocess(
  parseDiscountInputForUpdate,
  z.number().min(0, "desconto não pode ser negativo").optional()
);

export const budgetIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const listBudgetsQuerySchema = paginationQuerySchema.extend({
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  status: z.enum(budgetStatuses).optional()
});

const budgetItemSchema = z.object({
  description: z.string().trim().min(2, "descrição do item deve ter pelo menos 2 caracteres"),
  quantity: positiveNumber,
  unitAmount: positiveNumber
});

const budgetBaseSchema = z.object({
  clientId: z.string().cuid("cliente inválido"),
  projectId: optionalProjectId,
  title: z.string().trim().min(2, "título deve ter pelo menos 2 caracteres"),
  serviceType: z.string().trim().min(2, "tipo de serviço deve ter pelo menos 2 caracteres"),
  description: optionalText,
  discount: createDiscountNumber.default(0),
  paymentMethod: optionalText,
  expiresAt: optionalDate,
  status: z.enum(budgetStatuses).default("DRAFT")
});

export const createBudgetSchema = budgetBaseSchema.extend({
  items: z.array(budgetItemSchema).min(1, "orçamento enviado exige pelo menos 1 item")
});

export const updateBudgetSchema = budgetBaseSchema
  .extend({
    discount: updateDiscountNumber,
    items: z.array(budgetItemSchema).min(1, "orçamento enviado exige pelo menos 1 item").optional()
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export const approveBudgetSchema = z
  .object({
    name: optionalText,
    type: z.enum(projectTypes),
    status: z.enum(projectStatuses).default("CONTRACT_SIGNED"),
    workAddress: optionalText,
    area: optionalPositiveNumber,
    startsAt: optionalDate,
    expectedDeliveryDate: optionalDate,
    description: optionalText,
    notes: optionalText,
    internalNotes: optionalText
  })
  .superRefine(validateProjectDateRange);

export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type ApproveBudgetInput = z.infer<typeof approveBudgetSchema>;

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

function parseDiscountInputForCreate(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  return parseNumberInput(value);
}

function parseDiscountInputForUpdate(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return parseNumberInput(value);
}

function validateProjectDateRange(data: { startsAt?: Date; expectedDeliveryDate?: Date }, context: z.RefinementCtx) {
  if (data.startsAt && data.expectedDeliveryDate && data.expectedDeliveryDate < data.startsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expectedDeliveryDate"],
      message: "data de entrega não pode ser anterior à data de início"
    });
  }
}
