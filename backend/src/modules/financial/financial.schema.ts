import { z } from "zod";
import {
  cashMovementOrigins,
  cashMovementTypes,
  expenseClassifications,
  expenseEntryTypes,
  expenseStatuses,
  financialCategoryTypes,
  paymentMethods,
  paymentStatuses
} from "../../shared/domain.js";
import { paginationQuerySchema } from "../../shared/pagination.js";

const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));
const requiredDate = z.coerce.date({ invalid_type_error: "data inválida" });
const positiveNumber = z.preprocess(parseNumberInput, z.number().positive("valor deve ser maior que zero"));
const optionalPositiveNumber = z.preprocess(
  parseOptionalNumberInput,
  z.number().positive("valor deve ser maior que zero").optional()
);
export const maxInstallmentCount = 12;

export const paymentIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const expenseIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const projectInstallmentsParamsSchema = z.object({
  projectId: z.string().cuid()
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
  .omit({ amount: true, projectId: true })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export const registerPaymentSchema = z.object({
  paidAmount: optionalPositiveNumber,
  paidAt: optionalDate
});

export const generateInstallmentsSchema = z.object({
  projectId: z.string().cuid("projeto inválido"),
  installments: z.coerce.number().int().min(1).max(maxInstallmentCount),
  firstDueDate: requiredDate,
  paymentMethod: z.enum(paymentMethods).optional(),
  description: optionalText,
  notes: optionalText
});

export const listFinancialCategoriesQuerySchema = z.object({
  type: z.enum(financialCategoryTypes).optional()
});

export const listExpensesQuerySchema = paginationQuerySchema
  .extend({
    clientId: z.string().cuid().optional(),
    projectId: z.string().cuid().optional(),
    categoryId: z.string().optional(),
    cashAccountId: z.string().optional(),
    classification: z.enum(expenseClassifications).optional(),
    status: z.enum(expenseStatuses).optional(),
    dueFrom: optionalDate,
    dueTo: optionalDate
  })
  .superRefine(validateDueDateRange);

const expenseInstallmentSchema = z.object({
  id: z.string().cuid().optional(),
  description: z.string().trim().min(2, "descrição deve ter pelo menos 2 caracteres").optional(),
  amount: positiveNumber,
  dueDate: requiredDate,
  installmentNumber: z.coerce.number().int().positive("parcela deve ser maior que zero").optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  notes: optionalText
});

const createExpenseBaseSchema = z.object({
  projectId: z.string().cuid("projeto inválido").optional(),
  clientId: z.string().cuid("cliente inválido").optional(),
  categoryId: optionalText,
  cashAccountId: optionalText,
  entryType: z.enum(expenseEntryTypes).optional(),
  classification: z.enum(expenseClassifications).optional(),
  description: z.string().trim().min(2, "descrição deve ter pelo menos 2 caracteres"),
  supplier: optionalText,
  costCenter: optionalText,
  amount: positiveNumber,
  dueDate: requiredDate.optional(),
  purchaseDate: optionalDate,
  paymentMethod: z.enum(paymentMethods).optional(),
  recurring: z.coerce.boolean().optional(),
  notes: optionalText,
  installments: z.array(expenseInstallmentSchema).max(maxInstallmentCount, `parcelamento deve ter no máximo ${maxInstallmentCount} parcelas`).optional()
});

export const createExpenseSchema = createExpenseBaseSchema.superRefine((data, context) => {
  if (data.installments && data.installments.length > 0) {
    if (data.installments.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installments"],
        message: "compra parcelada deve ter pelo menos 2 parcelas"
      });
      return;
    }

    const totalCents = Math.round(data.amount * 100);
    const installmentsCents = data.installments.reduce((total, installment) => total + Math.round(installment.amount * 100), 0);

    if (totalCents !== installmentsCents) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installments"],
        message: "a soma das parcelas deve ser igual ao valor total"
      });
    }

    return;
  }

  if (!data.dueDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueDate"],
      message: "informe o vencimento"
    });
  }
});

export const updateExpenseSchema = createExpenseBaseSchema.partial().strict().refine((data) => Object.keys(data).length > 0, {
  message: "informe pelo menos um campo para atualizar"
});

export const payExpenseSchema = z.object({
  paidAmount: optionalPositiveNumber,
  paidAt: optionalDate,
  paymentMethod: z.enum(paymentMethods).optional(),
  cashAccountId: optionalText,
  notes: optionalText
});

export const reorganizeExpenseInstallmentsSchema = z
  .object({
    installments: z
      .array(expenseInstallmentSchema.extend({ id: z.string().cuid().optional() }))
      .min(1, "informe pelo menos uma parcela")
      .max(maxInstallmentCount, `parcelamento deve ter no máximo ${maxInstallmentCount} parcelas`)
  })
  .superRefine(validateUniqueInstallmentIds);

export const listCashMovementsQuerySchema = paginationQuerySchema
  .extend({
    type: z.enum(cashMovementTypes).optional(),
    origin: z.enum(cashMovementOrigins).optional(),
    clientId: z.string().cuid().optional(),
    projectId: z.string().cuid().optional(),
    categoryId: z.string().optional(),
    cashAccountId: z.string().optional(),
    dateFrom: optionalDate,
    dateTo: optionalDate
  })
  .superRefine((data, context) => validateDateRange(data.dateFrom, data.dateTo, "dateTo", context));

export const cashPeriodQuerySchema = z
  .object({
    from: optionalDate,
    to: optionalDate,
    clientId: z.string().cuid().optional(),
    projectId: z.string().cuid().optional(),
    categoryId: z.string().optional(),
    cashAccountId: z.string().optional()
  })
  .superRefine((data, context) => validateDateRange(data.from, data.to, "to", context));

export const manualCashMovementSchema = z.object({
  type: z.enum(cashMovementTypes),
  date: requiredDate,
  description: z.string().trim().min(2, "descrição deve ter pelo menos 2 caracteres"),
  amount: positiveNumber,
  paymentMethod: z.enum(paymentMethods).optional(),
  categoryId: optionalText,
  cashAccountId: optionalText,
  clientId: z.string().cuid("cliente inválido").optional(),
  projectId: z.string().cuid("projeto inválido").optional(),
  notes: optionalText
});

const reorganizeInstallmentSchema = z.object({
  id: z.string().cuid().optional(),
  description: z.string().trim().min(2, "descrição deve ter pelo menos 2 caracteres"),
  amount: positiveNumber,
  installment: z.coerce.number().int().positive("parcela deve ser maior que zero").optional(),
  dueDate: requiredDate,
  paymentMethod: z.enum(paymentMethods).optional(),
  notes: optionalText
});

export const reorganizeInstallmentsSchema = z
  .object({
    installments: z
      .array(reorganizeInstallmentSchema)
      .min(1, "informe pelo menos uma parcela")
      .max(maxInstallmentCount, `parcelamento deve ter no máximo ${maxInstallmentCount} parcelas`)
  })
  .superRefine(validateUniqueInstallmentIds);

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
export type GenerateInstallmentsInput = z.infer<typeof generateInstallmentsSchema>;
export type ReorganizeInstallmentsInput = z.infer<typeof reorganizeInstallmentsSchema>;
export type ListFinancialCategoriesQuery = z.infer<typeof listFinancialCategoriesQuerySchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type PayExpenseInput = z.infer<typeof payExpenseSchema>;
export type ReorganizeExpenseInstallmentsInput = z.infer<typeof reorganizeExpenseInstallmentsSchema>;
export type ListCashMovementsQuery = z.infer<typeof listCashMovementsQuerySchema>;
export type CashPeriodQuery = z.infer<typeof cashPeriodQuerySchema>;
export type ManualCashMovementInput = z.infer<typeof manualCashMovementSchema>;

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
  validateDateRange(data.dueFrom, data.dueTo, "dueTo", context);
}

function validateDateRange(from: Date | undefined, to: Date | undefined, toPath: string, context: z.RefinementCtx) {
  if (from && to && to < from) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [toPath],
      message: "data final não pode ser anterior à data inicial"
    });
  }
}

function validateUniqueInstallmentIds(data: { installments: Array<{ id?: string }> }, context: z.RefinementCtx) {
  const ids = data.installments.map((installment) => installment.id).filter(Boolean);
  const uniqueIds = new Set(ids);

  if (ids.length !== uniqueIds.size) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["installments"],
      message: "não repita a mesma parcela no replanejamento"
    });
  }
}
