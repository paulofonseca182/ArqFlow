import { z } from "zod";
import {
  cashMovementTypeValues,
  expenseClassificationValues,
  paymentMethodValues,
  type CashMovementType,
  type Expense,
  type PayExpenseInput,
  type ExpenseWriteInput,
  type ManualCashMovementInput,
  type PaymentMethod
} from "../../types/financial";
import { parseCurrencyInput, toCurrencyInputValue } from "../../utils/currency";

const optionalText = z.string().trim().optional().transform((value) => value || undefined);
const optionalMethod = z
  .union([z.enum(paymentMethodValues), z.literal("")])
  .transform((value) => (value === "" ? undefined : value));
const optionalMovementType = z.union([z.enum(cashMovementTypeValues), z.literal("")]);
const moneyNumber = z.preprocess(parseCurrencyInput, z.number().positive("Informe um valor maior que zero."));
const expensePaymentModes = ["SINGLE", "INSTALLMENT_PURCHASE"] as const;
const installmentNumber = z.coerce.number().int().min(2).max(12);

const expenseInstallmentFormSchema = z.object({
  id: optionalText,
  description: optionalText,
  amount: moneyNumber,
  dueDate: z.string().trim().min(1, "Informe o vencimento."),
  installmentNumber: z.coerce.number().int().positive().optional(),
  paymentMethod: optionalMethod,
  notes: optionalText
});

export type ExpenseFormFields = {
  paymentMode: (typeof expensePaymentModes)[number];
  projectId: string;
  categoryId: string;
  cashAccountId: string;
  classification: (typeof expenseClassificationValues)[number];
  description: string;
  supplier: string;
  costCenter: string;
  amount: string;
  dueDate: string;
  purchaseDate: string;
  installmentCount: number;
  firstDueDate: string;
  installments: Array<{
    id?: string;
    description: string;
    amount: string;
    dueDate: string;
    installmentNumber?: number;
    paymentMethod: PaymentMethod | "";
    notes: string;
  }>;
  paymentMethod: PaymentMethod | "";
  recurring: boolean;
  notes: string;
};

export type ManualCashMovementFormFields = {
  type: CashMovementType | "";
  categoryId: string;
  cashAccountId: string;
  date: string;
  description: string;
  amount: string;
  paymentMethod: PaymentMethod | "";
  notes: string;
};

export type PayExpenseFormFields = {
  paidAmount: string;
  paidAt: string;
  paymentMethod: PaymentMethod | "";
  cashAccountId: string;
  notes: string;
};

export const expenseFormSchema = z.object({
  paymentMode: z.enum(expensePaymentModes),
  projectId: optionalText,
  categoryId: optionalText,
  cashAccountId: optionalText,
  classification: z.enum(expenseClassificationValues),
  description: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
  supplier: optionalText,
  costCenter: optionalText,
  amount: moneyNumber,
  dueDate: z.string().trim().optional(),
  purchaseDate: z.string().trim().optional(),
  installmentCount: installmentNumber,
  firstDueDate: z.string().trim().optional(),
  installments: z.array(expenseInstallmentFormSchema).optional(),
  paymentMethod: optionalMethod,
  recurring: z.boolean(),
  notes: optionalText
}).superRefine((data, context) => {
  if (data.paymentMode === "SINGLE" && !data.dueDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueDate"],
      message: "Informe o vencimento."
    });
  }

  if (data.paymentMode === "INSTALLMENT_PURCHASE") {
    if (!data.purchaseDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purchaseDate"],
        message: "Informe a data da compra."
      });
    }

    if (!data.installments || data.installments.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installments"],
        message: "Gere pelo menos 2 parcelas."
      });
      return;
    }

    const expectedCents = Math.round(data.amount * 100);
    const installmentCents = data.installments.reduce((total, installment) => total + Math.round(installment.amount * 100), 0);

    if (expectedCents !== installmentCents) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installments"],
        message: "A soma das parcelas precisa fechar com o valor total."
      });
    }
  }
});

export const manualCashMovementFormSchema = z.object({
  type: optionalMovementType.refine((value) => value !== "", "Informe o tipo."),
  categoryId: optionalText,
  cashAccountId: optionalText,
  date: z.string().trim().min(1, "Informe a data."),
  description: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
  amount: moneyNumber,
  paymentMethod: optionalMethod,
  notes: optionalText
});

export const payExpenseFormSchema = z.object({
  paidAmount: moneyNumber,
  paidAt: z.string().trim().min(1, "Informe a data de pagamento."),
  paymentMethod: optionalMethod,
  cashAccountId: optionalText,
  notes: optionalText
});

export type ExpenseFormPayload = z.infer<typeof expenseFormSchema>;
export type ManualCashMovementFormPayload = z.infer<typeof manualCashMovementFormSchema>;
export type PayExpenseFormPayload = z.infer<typeof payExpenseFormSchema>;

export function getExpenseFormDefaults(expense?: Expense | null): ExpenseFormFields {
  const today = toDateInputValue(new Date().toISOString());
  const installments: ExpenseFormFields["installments"] = expense?.installments?.map((installment, index) => ({
    id: installment.id,
    description: installment.description,
    amount: toCurrencyInputValue(installment.amount),
    dueDate: toDateInputValue(installment.dueDate),
    installmentNumber: installment.installmentNumber ?? index + 1,
    paymentMethod: installment.paymentMethod ?? "",
    notes: installment.notes ?? ""
  })) ?? [];

  return {
    paymentMode: expense?.entryType === "PURCHASE" ? "INSTALLMENT_PURCHASE" : "SINGLE",
    projectId: expense?.projectId ?? "",
    categoryId: expense?.categoryId ?? "",
    cashAccountId: expense?.cashAccountId ?? "",
    classification: expense?.classification ?? "OPERATIONAL_EXPENSE",
    description: expense?.description ?? "",
    supplier: expense?.supplier ?? "",
    costCenter: expense?.costCenter ?? "",
    amount: toCurrencyInputValue(expense?.amount),
    dueDate: toDateInputValue(expense?.dueDate),
    purchaseDate: toDateInputValue(expense?.purchaseDate) || today,
    installmentCount: expense?.installmentCount && expense.installmentCount > 1 ? expense.installmentCount : 2,
    firstDueDate: installments[0]?.dueDate ?? today,
    installments,
    paymentMethod: expense?.paymentMethod ?? "",
    recurring: expense?.recurring ?? false,
    notes: expense?.notes ?? ""
  };
}

export function getManualCashMovementDefaults(): ManualCashMovementFormFields {
  return {
    type: "",
    categoryId: "",
    cashAccountId: "",
    date: toDateInputValue(new Date().toISOString()),
    description: "",
    amount: "",
    paymentMethod: "",
    notes: ""
  };
}

export function getPayExpenseDefaults(expense?: Expense | null): PayExpenseFormFields {
  return {
    paidAmount: toCurrencyInputValue(expense?.pendingAmount ?? expense?.amount),
    paidAt: toDateInputValue(new Date().toISOString()),
    paymentMethod: expense?.paymentMethod ?? "",
    cashAccountId: expense?.cashAccountId ?? "",
    notes: ""
  };
}

export function normalizeExpensePayload(data: ExpenseFormPayload, options: { includeInstallments?: boolean } = {}): ExpenseWriteInput {
  return {
    projectId: data.projectId,
    categoryId: data.categoryId,
    cashAccountId: data.cashAccountId,
    classification: data.classification,
    description: data.description.trim(),
    supplier: data.supplier,
    costCenter: data.costCenter,
    amount: data.amount,
    dueDate: data.paymentMode === "SINGLE" ? data.dueDate : undefined,
    purchaseDate: data.purchaseDate,
    paymentMethod: data.paymentMethod,
    recurring: data.recurring,
    notes: data.notes,
    installments: options.includeInstallments
      ? data.installments?.map((installment, index) => ({
          id: installment.id,
          description: installment.description,
          amount: installment.amount,
          dueDate: installment.dueDate,
          installmentNumber: installment.installmentNumber ?? index + 1,
          paymentMethod: installment.paymentMethod,
          notes: installment.notes
        }))
      : undefined
  };
}

export function buildExpenseInstallmentDefaults({
  amount,
  count,
  firstDueDate,
  paymentMethod,
  title
}: {
  amount: string;
  count: number;
  firstDueDate: string;
  paymentMethod: PaymentMethod | "";
  title: string;
}) {
  const total = parseCurrencyInput(amount);
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  const firstDate = firstDueDate ? new Date(`${firstDueDate}T00:00:00`) : new Date();

  return Array.from({ length: count }, (_item, index) => {
    const dueDate = new Date(firstDate);
    dueDate.setMonth(firstDate.getMonth() + index);

    return {
      description: title ? `${title} - parcela ${index + 1}/${count}` : `Parcela ${index + 1}/${count}`,
      amount: toCurrencyInputValue((baseCents + (index < remainder ? 1 : 0)) / 100),
      dueDate: toDateInputValue(dueDate.toISOString()),
      installmentNumber: index + 1,
      paymentMethod,
      notes: ""
    };
  });
}

export function normalizeManualCashMovementPayload(data: ManualCashMovementFormPayload): ManualCashMovementInput {
  return {
    type: data.type,
    categoryId: data.categoryId,
    cashAccountId: data.cashAccountId,
    date: data.date,
    description: data.description.trim(),
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    notes: data.notes
  };
}

export function normalizePayExpensePayload(data: PayExpenseFormPayload): PayExpenseInput {
  return {
    paidAmount: data.paidAmount,
    paidAt: data.paidAt,
    paymentMethod: data.paymentMethod,
    cashAccountId: data.cashAccountId,
    notes: data.notes
  };
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}
