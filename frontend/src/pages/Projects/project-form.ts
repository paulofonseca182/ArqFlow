import { z } from "zod";
import { projectStatusValues, projectTypeValues } from "../../types/project";
import type { Project, ProjectWriteInput } from "../../types/project";

export type ProjectFormFields = {
  clientId: string;
  name: string;
  type: (typeof projectTypeValues)[number];
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

    const normalized = Number(value.replace(/\./g, "").replace(",", "."));
    return normalized;
  })
  .refine((value) => value === undefined || (Number.isFinite(value) && value > 0), {
    message: "Informe um valor maior que zero."
  });

export const projectFormSchema = z
  .object({
    clientId: z.string().trim().min(1, "Selecione um cliente."),
    name: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
    type: z.enum(projectTypeValues),
    status: z.enum(projectStatusValues),
    workAddress: optionalText,
    area: optionalPositiveNumber,
    contractedAmount: optionalPositiveNumber,
    startsAt: optionalDate,
    expectedDeliveryDate: optionalDate,
    description: optionalText,
    notes: optionalText,
    internalNotes: optionalText,
    pinned: z.boolean()
  })
  .superRefine((data, context) => {
    if (data.startsAt && data.expectedDeliveryDate && new Date(data.expectedDeliveryDate) < new Date(data.startsAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expectedDeliveryDate"],
        message: "A entrega nao pode ser anterior ao inicio."
      });
    }
  });

export type ProjectFormPayload = z.infer<typeof projectFormSchema>;

export function getProjectFormDefaults(project?: Project | null): ProjectFormFields {
  return {
    clientId: project?.clientId ?? "",
    name: project?.name ?? "",
    type: project?.type ?? "RESIDENTIAL",
    status: project?.status ?? "CONTRACT_IN_PROGRESS",
    workAddress: project?.workAddress ?? "",
    area: project?.area ?? "",
    contractedAmount: project?.contractedAmount ?? "",
    startsAt: toDateInputValue(project?.startsAt),
    expectedDeliveryDate: toDateInputValue(project?.expectedDeliveryDate),
    description: project?.description ?? "",
    notes: project?.notes ?? "",
    internalNotes: project?.internalNotes ?? "",
    pinned: project?.pinned ?? false
  };
}

export function normalizeProjectPayload(data: ProjectFormPayload): ProjectWriteInput {
  return {
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
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}
