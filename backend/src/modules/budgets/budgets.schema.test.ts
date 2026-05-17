import { describe, expect, it } from "vitest";
import { approveBudgetSchema, createBudgetSchema, listBudgetsQuerySchema, updateBudgetSchema } from "./budgets.schema.js";

const validClientId = "clw0000000000000000000000";
const validProjectId = "clw0000000000000000000001";

const validBudget = {
  clientId: validClientId,
  title: "Projeto de interiores",
  serviceType: "Interiores",
  items: [
    {
      description: "Estudo preliminar",
      quantity: 1,
      unitAmount: 2500
    }
  ]
};

describe("budgets schema", () => {
  it("exige cliente e título no cadastro", () => {
    expect(createBudgetSchema.safeParse({ ...validBudget, clientId: undefined }).success).toBe(false);
    expect(createBudgetSchema.safeParse({ ...validBudget, title: "" }).success).toBe(false);
  });

  it("orçamento enviado exige pelo menos 1 item", () => {
    expect(createBudgetSchema.safeParse({ ...validBudget, items: [] }).success).toBe(false);
  });

  it("bloqueia quantidade e valor unitário inválidos", () => {
    expect(
      createBudgetSchema.safeParse({
        ...validBudget,
        items: [{ description: "Item inválido", quantity: 0, unitAmount: 100 }]
      }).success
    ).toBe(false);
    expect(
      createBudgetSchema.safeParse({
        ...validBudget,
        items: [{ description: "Item inválido", quantity: 1, unitAmount: -100 }]
      }).success
    ).toBe(false);
  });

  it("bloqueia desconto negativo", () => {
    expect(createBudgetSchema.safeParse({ ...validBudget, discount: -1 }).success).toBe(false);
  });

  it("normaliza desconto vazio para zero", () => {
    const result = createBudgetSchema.parse({ ...validBudget, discount: "" });

    expect(result.discount).toBe(0);
  });

  it("permite update parcial com pelo menos um campo", () => {
    expect(updateBudgetSchema.safeParse({}).success).toBe(false);
    expect(updateBudgetSchema.safeParse({ status: "NEGOTIATION" }).success).toBe(true);
  });

  it("valida escopo composto de orçamentos abertos e período de criação", () => {
    expect(
      listBudgetsQuerySchema.safeParse({
        projectId: validProjectId,
        scope: "OPEN_BUDGETS",
        createdFrom: "2026-05-01",
        createdTo: "2026-05-31"
      }).success
    ).toBe(true);

    expect(listBudgetsQuerySchema.safeParse({ scope: "OPEN" }).success).toBe(false);
    expect(
      listBudgetsQuerySchema.safeParse({
        createdFrom: "2026-05-31",
        createdTo: "2026-05-01"
      }).success
    ).toBe(false);
  });

  it("valida dados para aprovar e converter em projeto", () => {
    expect(approveBudgetSchema.safeParse({ type: "INTERIORS" }).success).toBe(true);
    expect(approveBudgetSchema.safeParse({ type: "INTERIORS", area: 0 }).success).toBe(false);
    expect(
      approveBudgetSchema.safeParse({
        type: "INTERIORS",
        startsAt: "2026-08-10",
        expectedDeliveryDate: "2026-08-01"
      }).success
    ).toBe(false);
  });
});
