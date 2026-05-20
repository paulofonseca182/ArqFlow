import { describe, expect, it } from "vitest";
import {
  assertBudgetCanBeApproved,
  assertBudgetCanBeConverted,
  buildBudgetWhere,
  buildConvertedProjectData,
  getBudgetsMeta,
  prepareBudgetAmounts
} from "./budgets.service.js";

describe("budgets service", () => {
  it("retorna metadados de status de orcamentos", () => {
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
      OR: [{ projectId: "clw0000000000000000000001" }, { convertedProjectId: "clw0000000000000000000001" }],
      status: "SENT"
    });
  });

  it("monta escopo de orcamentos abertos com periodo de criacao", () => {
    expect(
      buildBudgetWhere({
        createdFrom: new Date(2026, 4, 1),
        createdTo: new Date(2026, 4, 31),
        scope: "OPEN_BUDGETS"
      })
    ).toEqual({
      createdAt: {
        gte: new Date(2026, 4, 1),
        lte: new Date(2026, 4, 31, 23, 59, 59, 999)
      },
      status: {
        in: ["DRAFT", "SENT", "NEGOTIATION"]
      }
    });
  });

  it("combina escopo de orcamentos abertos com projeto", () => {
    expect(
      buildBudgetWhere({
        projectId: "clw0000000000000000000001",
        scope: "OPEN_BUDGETS"
      })
    ).toEqual({
      OR: [{ projectId: "clw0000000000000000000001" }, { convertedProjectId: "clw0000000000000000000001" }],
      status: {
        in: ["DRAFT", "SENT", "NEGOTIATION"]
      }
    });
  });

  it("monta busca por titulo, servico, cliente, projeto e item", () => {
    expect(buildBudgetWhere({ search: "interiores" })).toEqual({
      OR: [
        { title: { contains: "interiores" } },
        { serviceType: { contains: "interiores" } },
        { description: { contains: "interiores" } },
        { client: { name: { contains: "interiores" } } },
        { project: { name: { contains: "interiores" } } },
        { convertedProject: { name: { contains: "interiores" } } },
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

  it("prepara dados de projeto a partir de orcamento aprovado", () => {
    const convertedAt = new Date("2026-05-20T12:00:00.000Z");

    expect(
      buildConvertedProjectData(
        {
          approvedAt: null,
          clientId: "clw0000000000000000000000",
          description: "Escopo aprovado",
          finalAmount: "3250",
          id: "clw0000000000000000000002",
          title: "Projeto de interiores"
        },
        {
          status: "CONTRACT_SIGNED",
          type: "INTERIORS"
        },
        convertedAt
      )
    ).toEqual({
      area: undefined,
      approvedAt: convertedAt,
      budgetId: "clw0000000000000000000002",
      clientId: "clw0000000000000000000000",
      contractedAmount: 3250,
      convertedAt,
      description: "Escopo aprovado",
      expectedDeliveryDate: undefined,
      internalNotes: undefined,
      manualReason: null,
      name: "Projeto de interiores",
      notes: undefined,
      origin: "BUDGET_APPROVAL",
      startsAt: undefined,
      status: "CONTRACT_SIGNED",
      type: "INTERIORS",
      workAddress: undefined
    });
  });

  it("bloqueia conversao incoerente de orcamento em projeto", () => {
    expect(() => assertBudgetCanBeConverted({ itemCount: 1, status: "APPROVED" })).not.toThrow();
    expect(() => assertBudgetCanBeConverted({ itemCount: 0, status: "APPROVED" })).toThrow("pelo menos 1 item");
    expect(() => assertBudgetCanBeConverted({ itemCount: 1, projectId: "project-1", status: "APPROVED" })).toThrow("vinculado");
    expect(() => assertBudgetCanBeConverted({ convertedProjectId: "project-1", itemCount: 1, status: "APPROVED" })).toThrow("vinculado");
    expect(() => assertBudgetCanBeConverted({ itemCount: 1, status: "SENT" })).toThrow("aprovado");
  });

  it("bloqueia aprovacao fora do fluxo comercial", () => {
    expect(() => assertBudgetCanBeApproved({ itemCount: 1, status: "SENT" })).not.toThrow();
    expect(() => assertBudgetCanBeApproved({ itemCount: 1, status: "NEGOTIATION" })).not.toThrow();
    expect(() => assertBudgetCanBeApproved({ itemCount: 0, status: "SENT" })).toThrow("pelo menos 1 item");
    expect(() => assertBudgetCanBeApproved({ itemCount: 1, status: "DRAFT" })).toThrow("enviado ou em negocia");
    expect(() => assertBudgetCanBeApproved({ itemCount: 1, status: "APPROVED" })).toThrow("enviado ou em negocia");
  });
});
