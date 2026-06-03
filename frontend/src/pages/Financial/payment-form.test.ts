import { describe, expect, it } from "vitest";
import { generateInstallmentsFormSchema, normalizePaymentUpdatePayload, paymentUpdateFormSchema } from "./payment-form";

describe("payment form", () => {
  it("nao envia valor na edicao comum de parcela", () => {
    const parsed = paymentUpdateFormSchema.parse({
      amount: "R$ 900,00",
      description: "Parcela 1/3",
      dueDate: "2026-06-10",
      installment: "1",
      notes: "Ajuste de vencimento",
      paymentMethod: "PIX",
      projectId: "clw0000000000000000000000"
    });

    expect(normalizePaymentUpdatePayload(parsed)).toEqual({
      description: "Parcela 1/3",
      dueDate: "2026-06-10",
      installment: 1,
      notes: "Ajuste de vencimento",
      paymentMethod: "PIX"
    });
    expect(normalizePaymentUpdatePayload(parsed)).not.toHaveProperty("amount");
  });

  it("aceita geracao de parcelas de 1 a 12x", () => {
    expect(
      generateInstallmentsFormSchema.safeParse({
        description: "",
        projectId: "clw0000000000000000000000",
        installments: "12",
        firstDueDate: "2026-06-10",
        notes: "",
        paymentMethod: ""
      }).success
    ).toBe(true);

    expect(
      generateInstallmentsFormSchema.safeParse({
        description: "",
        projectId: "clw0000000000000000000000",
        installments: "13",
        firstDueDate: "2026-06-10",
        notes: "",
        paymentMethod: ""
      }).success
    ).toBe(false);
  });
});
