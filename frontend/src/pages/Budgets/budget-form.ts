import { z } from "zod";
import { budgetStatusValues } from "../../types/budget";
import type { Budget, BudgetWriteInput } from "../../types/budget";
import { parseCurrencyInput, toCurrencyInputValue } from "../../utils/currency";

export type BudgetFormItemFields = {
  description: string;
  quantity: string;
  unitAmount: string;
};

export type BudgetFormFields = {
  clientId: string;
  title: string;
  serviceType: string;
  description: string;
  discount: string;
  paymentMethod: string;
  expiresAt: string;
  status: (typeof budgetStatusValues)[number];
  items: BudgetFormItemFields[];
};

const optionalText = z.string().trim().transform((value) => value || undefined);
const optionalDate = z.string().trim().transform((value) => value || undefined);
const quantityNumber = z
  .string()
  .trim()
  .transform((value) => Number(value.replace(/\./g, "").replace(",", ".")))
  .refine((value) => Number.isFinite(value) && value > 0, {
    message: "Informe um valor maior que zero."
  });
const currencyNumber = z.preprocess(parseCurrencyInput, z.number().positive("Informe um valor maior que zero."));
const discountNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  return parseCurrencyInput(value);
}, z.number().min(0, "Desconto não pode ser negativo."));

const budgetItemSchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição do item."),
  quantity: quantityNumber,
  unitAmount: currencyNumber
});

export const budgetFormSchema = z.object({
  clientId: z.string().trim().min(1, "Selecione um cliente."),
  title: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
  serviceType: z.string().trim().min(2, "Informe o tipo de serviço."),
  description: optionalText,
  discount: discountNumber,
  paymentMethod: optionalText,
  expiresAt: optionalDate,
  status: z.enum(budgetStatusValues),
  items: z.array(budgetItemSchema).min(1, "Adicione pelo menos um item.")
});

export type BudgetFormPayload = z.infer<typeof budgetFormSchema>;

export function getBudgetFormDefaults(budget?: Budget | null): BudgetFormFields {
  return {
    clientId: budget?.clientId ?? "",
    title: budget?.title ?? "",
    serviceType: budget?.serviceType ?? "",
    description: budget?.description ?? "",
    discount: toCurrencyInputValue(budget?.discount),
    paymentMethod: budget?.paymentMethod ?? "",
    expiresAt: toDateInputValue(budget?.expiresAt),
    status: budget?.status ?? "DRAFT",
    items:
      budget?.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitAmount: toCurrencyInputValue(item.unitAmount)
      })) ?? [getEmptyBudgetItem()]
  };
}

export function getEmptyBudgetItem(): BudgetFormItemFields {
  return {
    description: "",
    quantity: "1",
    unitAmount: ""
  };
}

export function normalizeBudgetPayload(data: BudgetFormPayload): BudgetWriteInput {
  return {
    clientId: data.clientId,
    title: data.title.trim(),
    serviceType: data.serviceType.trim(),
    description: data.description,
    discount: data.discount,
    paymentMethod: data.paymentMethod,
    expiresAt: data.expiresAt,
    status: data.status,
    items: data.items.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unitAmount: item.unitAmount
    }))
  };
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}
