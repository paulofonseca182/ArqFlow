import { describe, expect, it } from "vitest";
import { getBudgetFormSchema } from "./budget-form";

const validBudgetForm = {
  clientId: "client-1",
  title: "Projeto de interiores",
  serviceType: "Interiores",
  description: "",
  discount: "",
  paymentMethod: "",
  expiresAt: "",
  status: "DRAFT",
  items: [
    {
      description: "Estudo preliminar",
      quantity: "1",
      unitAmount: "2.500,00"
    }
  ]
};

describe("budget form schema", () => {
  it("limita titulo e tipo de servico", () => {
    const schema = getBudgetFormSchema("2026-05-20");

    expect(schema.safeParse({ ...validBudgetForm, title: "A".repeat(30) }).success).toBe(true);
    expect(schema.safeParse({ ...validBudgetForm, title: "A".repeat(31) }).success).toBe(false);
    expect(schema.safeParse({ ...validBudgetForm, serviceType: "B".repeat(20) }).success).toBe(true);
    expect(schema.safeParse({ ...validBudgetForm, serviceType: "B".repeat(21) }).success).toBe(false);
  });

  it("bloqueia validade anterior a data minima informada", () => {
    const schema = getBudgetFormSchema("2026-05-20");

    expect(schema.safeParse({ ...validBudgetForm, expiresAt: "2026-05-19" }).success).toBe(false);
    expect(schema.safeParse({ ...validBudgetForm, expiresAt: "2026-05-20" }).success).toBe(true);
    expect(schema.safeParse({ ...validBudgetForm, expiresAt: "2026-05-21" }).success).toBe(true);
  });
});
