import { describe, expect, it } from "vitest";
import {
  calculateBudgetFinalAmount,
  calculateProjectProgress,
  ensureDocumentHasOwner,
  isPaymentOverdue
} from "./business-rules.js";

describe("business rules", () => {
  it("calcula valor final do orçamento no backend", () => {
    expect(
      calculateBudgetFinalAmount(
        [
          { quantity: 2, unitAmount: 1500 },
          { quantity: 1, unitAmount: 500 }
        ],
        250
      )
    ).toEqual({ totalAmount: 3500, finalAmount: 3250 });
  });

  it("bloqueia valores financeiros invalidos", () => {
    expect(() => calculateBudgetFinalAmount([{ quantity: 1, unitAmount: 0 }])).toThrow("valor unitario");
  });

  it("exige pelo menos um item no orçamento", () => {
    expect(() => calculateBudgetFinalAmount([])).toThrow("pelo menos um item");
  });

  it("bloqueia desconto maior que o total", () => {
    expect(() => calculateBudgetFinalAmount([{ quantity: 1, unitAmount: 100 }], 150)).toThrow("valor final");
  });

  it("calcula progresso por etapas concluidas", () => {
    expect(calculateProjectProgress(4, 3)).toBe(75);
    expect(calculateProjectProgress(0, 0)).toBe(0);
  });

  it("bloqueia progresso incoerente", () => {
    expect(() => calculateProjectProgress(2, 3)).toThrow("ultrapassar");
    expect(() => calculateProjectProgress(2, -1)).toThrow("negativa");
  });

  it("calcula pagamento atrasado dinamicamente", () => {
    expect(isPaymentOverdue({ dueDate: new Date("2026-05-10"), status: "RECEIVABLE" }, new Date("2026-05-11"))).toBe(
      true
    );
    expect(
      isPaymentOverdue({ dueDate: new Date("2026-05-10"), status: "PARTIALLY_PAID" }, new Date("2026-05-11"))
    ).toBe(true);
    expect(isPaymentOverdue({ dueDate: new Date("2026-05-10"), status: "PAID" }, new Date("2026-05-11"))).toBe(false);
    expect(isPaymentOverdue({ dueDate: new Date("2026-05-11"), status: "RECEIVABLE" }, new Date("2026-05-11"))).toBe(
      false
    );
  });

  it("exige cliente e/ou projeto para documentos", () => {
    expect(() => ensureDocumentHasOwner(null, null)).toThrow("documento");
    expect(() => ensureDocumentHasOwner("client-1", null)).not.toThrow();
    expect(() => ensureDocumentHasOwner(null, "project-1")).not.toThrow();
  });
});
