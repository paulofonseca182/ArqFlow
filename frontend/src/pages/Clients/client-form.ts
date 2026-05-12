import { z } from "zod";
import { clientStatusValues } from "../../types/client";
import type { Client, ClientWriteInput } from "../../types/client";

export type ClientFormFields = {
  name: string;
  status: (typeof clientStatusValues)[number];
  phone: string;
  whatsapp: string;
  email: string;
  cpfCnpj: string;
  address: string;
  city: string;
  state: string;
  source: string;
  notes: string;
};

const optionalText = z.string().trim().transform((value) => value || undefined);
const optionalEmail = optionalText.refine((value) => !value || z.string().email().safeParse(value).success, {
  message: "Informe um email valido."
});
const optionalCpfCnpj = optionalText.refine((value) => !value || isValidCpfCnpj(value), {
  message: "Informe um CPF ou CNPJ valido."
});

export const clientFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
    status: z.enum(clientStatusValues),
    phone: optionalText,
    whatsapp: optionalText,
    email: optionalEmail,
    cpfCnpj: optionalCpfCnpj,
    address: optionalText,
    city: optionalText,
    state: optionalText,
    source: optionalText,
    notes: optionalText
  })
  .superRefine((data, context) => {
    const phoneDigits = data.phone ? onlyDigits(data.phone) : "";
    const whatsappDigits = data.whatsapp ? onlyDigits(data.whatsapp) : "";

    if (!phoneDigits && !whatsappDigits) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Informe telefone ou WhatsApp."
      });
    }

    if (data.phone && phoneDigits.length < 10) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Telefone invalido."
      });
    }

    if (data.whatsapp && whatsappDigits.length < 10) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp"],
        message: "WhatsApp invalido."
      });
    }
  });

export type ClientFormPayload = z.infer<typeof clientFormSchema>;

export function getClientFormDefaults(client?: Client | null): ClientFormFields {
  return {
    name: client?.name ?? "",
    status: client?.status ?? "NEW_CONTACT",
    phone: client?.phone ?? "",
    whatsapp: client?.whatsapp ?? "",
    email: client?.email ?? "",
    cpfCnpj: client?.cpfCnpj ?? "",
    address: client?.address ?? "",
    city: client?.city ?? "",
    state: client?.state ?? "",
    source: client?.source ?? "",
    notes: client?.notes ?? ""
  };
}

export function normalizeClientPayload(data: ClientFormPayload): ClientWriteInput {
  return {
    name: data.name.trim(),
    status: data.status,
    phone: data.phone ? onlyDigits(data.phone) : undefined,
    whatsapp: data.whatsapp ? onlyDigits(data.whatsapp) : undefined,
    email: data.email,
    cpfCnpj: data.cpfCnpj ? onlyDigits(data.cpfCnpj) : undefined,
    address: data.address,
    city: data.city,
    state: data.state,
    source: data.source,
    notes: data.notes
  };
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCpfCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return isValidCpf(digits);
  }

  if (digits.length === 14) {
    return isValidCnpj(digits);
  }

  return false;
}

function isValidCpf(cpf: string) {
  if (/^(\d)\1+$/.test(cpf)) {
    return false;
  }

  const firstDigit = calculateCpfDigit(cpf.slice(0, 9), 10);
  const secondDigit = calculateCpfDigit(cpf.slice(0, 10), 11);

  return cpf.endsWith(`${firstDigit}${secondDigit}`);
}

function calculateCpfDigit(base: string, weight: number) {
  const sum = [...base].reduce((total, digit) => {
    const result = total + Number(digit) * weight;
    weight -= 1;
    return result;
  }, 0);

  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function isValidCnpj(cnpj: string) {
  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const firstDigit = calculateCnpjDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateCnpjDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
}

function calculateCnpjDigit(base: string, weights: number[]) {
  const sum = [...base].reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
