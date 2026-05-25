import { z } from "zod";
import { manualProjectReasonValues, projectOriginValues, projectStatusValues, projectTypeValues } from "../../types/project";
import type { Project, ProjectWriteInput } from "../../types/project";
import { parseOptionalCurrencyInput, toCurrencyInputValue } from "../../utils/currency";

const manualProjectOriginValues = ["LEGACY", "INTERNAL"] as const;

export type ProjectFormFields = {
  clientId: string;
  name: string;
  type: (typeof projectTypeValues)[number];
  origin: Exclude<(typeof projectOriginValues)[number], "BUDGET_APPROVAL">;
  manualReason: (typeof manualProjectReasonValues)[number] | "";
  status: (typeof projectStatusValues)[number];
  workAddress: string;
  area: string;
  contractedAmount: string;
  startsAt: string;
  expectedDeliveryDate: string;
  description: string;
  notes: string;
  internalNotes: string;
  pinned: boolean;
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
const optionalCurrencyNumber = z.preprocess(
  parseOptionalCurrencyInput,
  z.number().positive("Informe um valor maior que zero.").optional()
);

const projectBaseFormSchema = z.object({
  clientId: z.string().trim().min(1, "Selecione um cliente."),
  name: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
  type: z.enum(projectTypeValues),
  status: z.enum(projectStatusValues),
  workAddress: optionalText,
  area: optionalPositiveNumber,
  contractedAmount: optionalCurrencyNumber,
  startsAt: optionalDate,
  expectedDeliveryDate: optionalDate,
  description: optionalText,
  notes: optionalText,
  internalNotes: optionalText,
  pinned: z.boolean()
});

export const projectFormSchema = projectBaseFormSchema
  .extend({
    origin: z.enum(manualProjectOriginValues),
    manualReason: z.enum(manualProjectReasonValues, {
      errorMap: () => ({ message: "Selecione o motivo do cadastro manual." })
    })
  })
  .superRefine((data, context) => {
    validateProjectFormDateRange(data, context);
    validateManualProjectForm(data, context);
  });

export const projectEditFormSchema = projectBaseFormSchema.superRefine(validateProjectFormDateRange);

export type ProjectFormPayload = z.infer<typeof projectFormSchema> | z.infer<typeof projectEditFormSchema>;

export function getProjectFormDefaults(project?: Project | null): ProjectFormFields {
  return {
    clientId: project?.clientId ?? "",
    name: project?.name ?? "",
    type: project?.type ?? "RESIDENTIAL",
    origin: project?.origin && project.origin !== "BUDGET_APPROVAL" ? project.origin : "LEGACY",
    manualReason: project?.manualReason ?? "",
    status: project?.status ?? "CONTRACT_IN_PROGRESS",
    workAddress: project?.workAddress ?? "",
    area: project?.area ?? "",
    contractedAmount: toCurrencyInputValue(project?.contractedAmount),
    startsAt: toDateInputValue(project?.startsAt),
    expectedDeliveryDate: toDateInputValue(project?.expectedDeliveryDate),
    description: project?.description ?? "",
    notes: project?.notes ?? "",
    internalNotes: project?.internalNotes ?? "",
    pinned: project?.pinned ?? false
  };
}

export function normalizeProjectPayload(data: ProjectFormPayload): ProjectWriteInput {
  const payload: ProjectWriteInput = {
    clientId: data.clientId,
    name: data.name.trim(),
    type: data.type,
    status: data.status,
    workAddress: data.workAddress,
    area: data.area,
    contractedAmount: data.contractedAmount,
    startsAt: data.startsAt,
    expectedDeliveryDate: data.expectedDeliveryDate,
    description: data.description,
    notes: data.notes,
    internalNotes: data.internalNotes,
    pinned: data.pinned
  };

  if ("origin" in data && data.origin) {
    payload.origin = data.origin;
  }

  if ("manualReason" in data && data.manualReason) {
    payload.manualReason = data.manualReason;
  }

  return payload;
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function validateProjectFormDateRange(
  data: { startsAt?: string; expectedDeliveryDate?: string },
  context: z.RefinementCtx
) {
  if (data.startsAt && data.expectedDeliveryDate && new Date(data.expectedDeliveryDate) < new Date(data.startsAt)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expectedDeliveryDate"],
      message: "A entrega não pode ser anterior ao início."
    });
  }
}

function validateManualProjectForm(
  data: {
    description?: string;
    manualReason?: string;
    notes?: string;
    origin?: string;
    startsAt?: string;
  },
  context: z.RefinementCtx
) {
  if (data.origin === "LEGACY") {
    if (data.manualReason !== "LEGACY_PROJECT") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualReason"],
        message: "Selecione projeto legado."
      });
    }

    if (!data.startsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "Informe a data de início original."
      });
    }

    if (!data.notes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notes"],
        message: "Informe a justificativa do projeto legado."
      });
    }
  }

  if (data.origin === "INTERNAL") {
    if (data.manualReason !== "INTERNAL_PROJECT") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualReason"],
        message: "Selecione projeto interno."
      });
    }

    if (!data.description) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "Informe a descrição ou motivo do projeto interno."
      });
    }
  }
}
