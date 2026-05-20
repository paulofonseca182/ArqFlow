import { z } from "zod";
import type { Budget, BudgetGenerateProjectInput } from "../../types/budget";
import { projectStatusValues, projectTypeValues } from "../../types/project";

export type ApproveBudgetFormFields = {
  name: string;
  type: (typeof projectTypeValues)[number];
  status: (typeof projectStatusValues)[number];
  workAddress: string;
  area: string;
  startsAt: string;
  expectedDeliveryDate: string;
  description: string;
  notes: string;
};

const optionalText = z.string().trim().transform((value) => value || undefined);
const optionalDate = z.string().trim().transform((value) => value || undefined);
const optionalPositiveNumber = z
  .string()
  .trim()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    return Number(value.replace(/\./g, "").replace(",", "."));
  })
  .refine((value) => value === undefined || (Number.isFinite(value) && value > 0), {
    message: "Informe um valor maior que zero."
  });

export const approveBudgetFormSchema = z
  .object({
    name: optionalText,
    type: z.enum(projectTypeValues),
    status: z.enum(projectStatusValues),
    workAddress: optionalText,
    area: optionalPositiveNumber,
    startsAt: optionalDate,
    expectedDeliveryDate: optionalDate,
    description: optionalText,
    notes: optionalText
  })
  .superRefine((data, context) => {
    if (data.startsAt && data.expectedDeliveryDate && new Date(data.expectedDeliveryDate) < new Date(data.startsAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expectedDeliveryDate"],
        message: "A entrega não pode ser anterior ao início."
      });
    }
  });

export type ApproveBudgetFormPayload = z.infer<typeof approveBudgetFormSchema>;

export function getApproveBudgetFormDefaults(budget?: Budget | null): ApproveBudgetFormFields {
  return {
    name: budget?.title ?? "",
    type: "INTERIORS",
    status: "CONTRACT_SIGNED",
    workAddress: "",
    area: "",
    startsAt: "",
    expectedDeliveryDate: "",
    description: budget?.description ?? "",
    notes: budget ? `Criado a partir do orçamento ${budget.title}.` : ""
  };
}

export function normalizeApproveBudgetPayload(data: ApproveBudgetFormPayload): BudgetGenerateProjectInput {
  return {
    name: data.name,
    type: data.type,
    status: data.status,
    workAddress: data.workAddress,
    area: data.area,
    startsAt: data.startsAt,
    expectedDeliveryDate: data.expectedDeliveryDate,
    description: data.description,
    notes: data.notes
  };
}
