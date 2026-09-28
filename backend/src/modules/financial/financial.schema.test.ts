import { describe, expect, it } from "vitest";
import {
  createPaymentSchema,
  generateInstallmentsSchema,
  listPaymentsQuerySchema,
  registerPaymentSchema,
  updatePaymentSchema
} from "./financial.schema.js";

describe("financial schema", () => {
  it("valida criação de parcela com projeto obrigatório e valor positivo", () => {
    const valid = createPaymentSchema.safeParse({
      projectId: "clw0000000000000000000000",
      description: "Parcela 1/2",
      amount: "1.500,50",
      dueDate: "2026-06-10",
      paymentMethod: "PIX"
    });

    expect(valid.success).toBe(true);
    expect(valid.success ? valid.data.amount : null).toBe(1500.5);

    const invalid = createPaymentSchema.safeParse({
      projectId: "clw0000000000000000000000",
      description: "Parcela 1/2",
      amount: 0,
      dueDate: "2026-06-10"
    });

    expect(invalid.success).toBe(false);
  });

  it("valida filtros de vencimento", () => {
    const valid = listPaymentsQuerySchema.safeParse({
      dueFrom: "2026-06-01",
      dueTo: "2026-06-30",
      status: "RECEIVABLE"
    });

    expect(valid.success).toBe(true);

    const invalid = listPaymentsQuerySchema.safeParse({
      dueFrom: "2026-06-30",
      dueTo: "2026-06-01"
    });

    expect(invalid.success).toBe(false);
  });

  it("aceita parcelamento de 1 a 12x", () => {
    expect(
      generateInstallmentsSchema.safeParse({
        projectId: "clw0000000000000000000000",
        installments: 12,
        firstDueDate: "2026-06-10"
      }).success
    ).toBe(true);

    expect(
      generateInstallmentsSchema.safeParse({
        projectId: "clw0000000000000000000000",
        installments: 13,
        firstDueDate: "2026-06-10"
      }).success
    ).toBe(false);
  });

  it("normaliza valor pago opcional", () => {
    const parsed = registerPaymentSchema.parse({
      paidAmount: "800,25",
      paidAt: "2026-06-10"
    });

    expect(parsed.paidAmount).toBe(800.25);
  });

  it("bloqueia alteração de valor na edição comum de parcela", () => {
    const result = updatePaymentSchema.safeParse({
      amount: "900,00",
      dueDate: "2026-06-10"
    });

    expect(result.success).toBe(false);
  });

  it("aceita alteracao de numero na edicao comum de parcela", () => {
    const result = updatePaymentSchema.safeParse({
      dueDate: "2026-06-10",
      installment: 2
    });

    expect(result.success).toBe(true);
  });
});
