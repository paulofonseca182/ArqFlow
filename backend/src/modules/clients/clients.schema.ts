import { z } from "zod";
import { clientStatuses } from "../../shared/domain.js";
import { paginationQuerySchema } from "../../shared/pagination.js";

const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalEmail = z.string().trim().email().optional().or(z.literal("").transform(() => undefined));
const optionalCpfCnpj = optionalText.refine((value) => !value || isValidCpfCnpj(value), {
  message: "CPF/CNPJ inválido"
});

export const clientIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const listClientsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(clientStatuses).optional()
});

const clientBaseSchema = z.object({
  name: z.string().trim().min(2, "nome deve ter pelo menos 2 caracteres"),
  status: z.enum(clientStatuses).default("NEW_CONTACT"),
  phone: optionalText,
  whatsapp: optionalText,
  email: optionalEmail,
  cpfCnpj: optionalCpfCnpj,
  address: optionalText,
  city: optionalText,
  state: optionalText,
  source: optionalText,
  notes: optionalText
});

export const createClientSchema = clientBaseSchema.refine((data) => data.phone || data.whatsapp, {
  message: "informe telefone ou WhatsApp",
  path: ["phone"]
});

export const updateClientSchema = clientBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

function isValidCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, "");

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
