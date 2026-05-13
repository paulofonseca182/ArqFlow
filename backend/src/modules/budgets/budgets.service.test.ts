import { describe, expect, it } from "vitest";
import { buildBudgetWhere, getBudgetsMeta, prepareBudgetAmounts } from "./budgets.service.js";

describe("budgets service", () => {
  it("retorna metadados de status de orçamentos", () => {
    const meta = getBudgetsMeta();

    expect(meta.statuses).toContainEqual({
      value: "DRAFT",
      label: "Rascunho"
    });
    expect(meta.statuses.map((status) => status.value)).toEqual([
      "DRAFT",
      "SENT",
      "NEGOTIATION",
      "APPROVED",
      "REFUSED",
      "EXPIRED",
      "CANCELLED"
    ]);
  });

  it("monta filtros por cliente, projeto e status", () => {
    expect(
      buildBudgetWhere({
        clientId: "clw0000000000000000000000",
        projectId: "clw0000000000000000000001",
        status: "SENT"
      })
    ).toEqual({
      clientId: "clw0000000000000000000000",
      projectId: "clw0000000000000000000001",
      status: "SENT"
    });
  });

  it("monta busca por título, serviço, cliente, projeto e item", () => {
    expect(buildBudgetWhere({ search: "interiores" })).toEqual({
      OR: [
        { title: { contains: "interiores" } },
        { serviceType: { contains: "interiores" } },
        { description: { contains: "interiores" } },
        { client: { name: { contains: "interiores" } } },
        { project: { name: { contains: "interiores" } } },
        { items: { some: { description: { contains: "interiores" } } } }
      ]
    });
  });

  it("calcula totais dos itens sem confiar no frontend", () => {
    expect(
      prepareBudgetAmounts(
        [
          { description: "Etapa 1", quantity: 2, unitAmount: 1500 },
          { description: "Etapa 2", quantity: 1, unitAmount: 500 }
        ],
        250
      )
    ).toEqual({
      totalAmount: 3500,
      finalAmount: 3250,
      items: [
        { description: "Etapa 1", quantity: 2, unitAmount: 1500, totalAmount: 3000 },
        { description: "Etapa 2", quantity: 1, unitAmount: 500, totalAmount: 500 }
      ]
    });
  });
});
