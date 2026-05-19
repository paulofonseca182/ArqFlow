import { z } from "zod";
import { visitStatusValues, visitTypeValues } from "../../types/visit";
import type { Visit, VisitWriteInput } from "../../types/visit";
import { parseOptionalCurrencyInput, toCurrencyInputValue } from "../../utils/currency";

export type VisitFormFields = {
  clientId: string;
  projectId: string;
  type: (typeof visitTypeValues)[number];
  date: string;
  time: string;
  address: string;
  amount: string;
  status: (typeof visitStatusValues)[number];
  notes: string;
};

const optionalText = z.string().trim().transform((value) => value || undefined);
const optionalProjectId = z.string().trim().transform((value) => value || null);
const optionalMoney = z.preprocess(parseOptionalCurrencyInput, z.number().positive("Informe um valor maior que zero.").optional());
const optionalTime = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .refine((value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), "Horário deve estar no formato HH:mm.");

export const visitFormSchema = z.object({
  clientId: z.string().trim().min(1, "Selecione um cliente."),
  projectId: optionalProjectId,
  type: z.enum(visitTypeValues),
  date: z.string().trim().min(1, "Informe a data."),
  time: optionalTime,
  address: optionalText,
  amount: optionalMoney,
  status: z.enum(visitStatusValues),
  notes: optionalText
});

export type VisitFormPayload = z.infer<typeof visitFormSchema>;

export function getVisitFormDefaults(visit?: Visit | null): VisitFormFields {
  return {
    clientId: visit?.clientId ?? "",
    projectId: visit?.projectId ?? "",
    type: visit?.type ?? "TECHNICAL_VISIT",
    date: toDateInputValue(visit?.date),
    time: visit?.time ?? "",
    address: visit?.address ?? "",
    amount: toCurrencyInputValue(visit?.amount),
    status: visit?.status ?? "SCHEDULED",
    notes: visit?.notes ?? ""
  };
}

export function normalizeVisitPayload(data: VisitFormPayload): VisitWriteInput {
  return {
    clientId: data.clientId,
    projectId: data.projectId,
    type: data.type,
    date: data.date,
    time: data.time,
    address: data.address,
    amount: data.amount,
    status: data.status,
    notes: data.notes
  };
}

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}
