import { z } from "zod";
import { paymentMethodValues } from "../../types/financial";
import type {
  GenerateInstallmentsInput,
  Payment,
  PaymentMethod,
  PaymentUpdateInput,
  PaymentWriteInput,
  RegisterPaymentInput
} from "../../types/financial";
import { parseCurrencyInput, parseOptionalCurrencyInput, toCurrencyInputValue } from "../../utils/currency";
import { toLocalDateInputValue } from "../../utils/date";

export const maxInstallmentCount = 12;

export type PaymentFormFields = {
  projectId: string;
  description: string;
  amount: string;
  installment: string;
  dueDate: string;
  paymentMethod: PaymentMethod | "";
  notes: string;
};

export type GenerateInstallmentsFormFields = {
  projectId: string;
  installments: string;
  firstDueDate: string;
  paymentMethod: PaymentMethod | "";
  description: string;
  notes: string;
};

export type RegisterPaymentFormFields = {
  paidAmount: string;
  paidAt: string;
};

const optionalText = z.string().trim().transform((value) => value || undefined);
const optionalMethod = z
  .union([z.enum(paymentMethodValues), z.literal("")])
  .transform((value) => (value === "" ? undefined : value));
const moneyNumber = z.preprocess(parseCurrencyInput, z.number().positive("Informe um valor maior que zero."));
const optionalMoneyNumber = z.preprocess(
  parseOptionalCurrencyInput,
  z.number().positive("Informe um valor maior que zero.").optional()
);
const optionalInstallmentNumber = z
  .string()
  .trim()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    return Number(value);
  })
  .refine((value) => value === undefined || (Number.isInteger(value) && value > 0), {
    message: "Informe uma parcela válida."
  });

export const paymentFormSchema = z.object({
  projectId: z.string().trim().min(1, "Selecione um projeto."),
  description: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
  amount: moneyNumber,
  installment: optionalInstallmentNumber,
  dueDate: z.string().trim().min(1, "Informe o vencimento."),
  paymentMethod: optionalMethod,
  notes: optionalText
});

export const paymentUpdateFormSchema = paymentFormSchema.omit({
  amount: true,
  projectId: true
});

export const generateInstallmentsFormSchema = z.object({
  projectId: z.string().trim().min(1, "Selecione um projeto."),
  installments: z.coerce.number().int().min(1, "Informe pelo menos 1 parcela.").max(maxInstallmentCount),
  firstDueDate: z.string().trim().min(1, "Informe o primeiro vencimento."),
  paymentMethod: optionalMethod,
  description: optionalText,
  notes: optionalText
});

export const registerPaymentFormSchema = z.object({
  paidAmount: optionalMoneyNumber,
  paidAt: z.string().trim().transform((value) => value || undefined)
});

export type PaymentFormPayload = z.infer<typeof paymentFormSchema>;
export type PaymentUpdateFormPayload = z.infer<typeof paymentUpdateFormSchema>;
export type GenerateInstallmentsFormPayload = z.infer<typeof generateInstallmentsFormSchema>;
export type RegisterPaymentFormPayload = z.infer<typeof registerPaymentFormSchema>;

export function getPaymentFormDefaults(payment?: Payment | null): PaymentFormFields {
  return {
    projectId: payment?.projectId ?? "",
    description: payment?.description ?? "",
    amount: toCurrencyInputValue(payment?.amount),
    installment: payment?.installment?.toString() ?? "",
    dueDate: toDateInputValue(payment?.dueDate),
    paymentMethod: payment?.paymentMethod ?? "",
    notes: payment?.notes ?? ""
  };
}

export function getGenerateInstallmentsDefaults(): GenerateInstallmentsFormFields {
  return {
    projectId: "",
    installments: "1",
    firstDueDate: "",
    paymentMethod: "",
    description: "",
    notes: ""
  };
}

export function getRegisterPaymentDefaults(payment?: Payment | null): RegisterPaymentFormFields {
  return {
    paidAmount: payment ? getRemainingAmount(payment) : "",
    paidAt: toLocalDateInputValue()
  };
}

export function normalizePaymentPayload(data: PaymentFormPayload): PaymentWriteInput {
  return {
    projectId: data.projectId,
    description: data.description.trim(),
    amount: data.amount,
    installment: data.installment,
    dueDate: data.dueDate,
    paymentMethod: data.paymentMethod,
    notes: data.notes
  };
}

export function normalizePaymentUpdatePayload(data: PaymentUpdateFormPayload): PaymentUpdateInput {
  return {
    description: data.description.trim(),
    installment: data.installment,
    dueDate: data.dueDate,
    paymentMethod: data.paymentMethod,
    notes: data.notes
  };
}

export function normalizeGenerateInstallmentsPayload(data: GenerateInstallmentsFormPayload): GenerateInstallmentsInput {
  return {
    projectId: data.projectId,
    installments: data.installments,
    firstDueDate: data.firstDueDate,
    paymentMethod: data.paymentMethod,
    description: data.description,
    notes: data.notes
  };
}

export function normalizeRegisterPaymentPayload(data: RegisterPaymentFormPayload): RegisterPaymentInput {
  return {
    paidAmount: data.paidAmount,
    paidAt: data.paidAt
  };
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function getRemainingAmount(payment: Payment) {
  const amount = Number(payment.amount);
  const paidAmount = Number(payment.paidAmount);
  const remaining = Math.max(amount - paidAmount, 0);

  return toCurrencyInputValue(remaining > 0 ? remaining : payment.amount);
}
