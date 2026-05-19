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
import type { Project } from "../../types/project";
import { parseCurrencyInput, parseOptionalCurrencyInput, toCurrencyInputValue } from "../../utils/currency";

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
  installments: "1" | "2" | "3";
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

export const generateInstallmentsFormSchema = z.object({
  projectId: z.string().trim().min(1, "Selecione um projeto."),
  installments: z.enum(["1", "2", "3"]),
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

export function getGenerateInstallmentsDefaults(project?: Project | null): GenerateInstallmentsFormFields {
  return {
    projectId: project?.id ?? "",
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
    paidAt: new Date().toISOString().slice(0, 10)
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

export function normalizePaymentUpdatePayload(data: PaymentFormPayload): PaymentUpdateInput {
  const { projectId: _projectId, ...payload } = normalizePaymentPayload(data);

  return payload;
}

export function normalizeGenerateInstallmentsPayload(data: GenerateInstallmentsFormPayload): GenerateInstallmentsInput {
  return {
    projectId: data.projectId,
    installments: Number(data.installments),
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
