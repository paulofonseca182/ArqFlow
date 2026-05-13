import { describe, expect, it } from "vitest";
import {
  assertBudgetCanBeConverted,
  buildBudgetWhere,
  buildConvertedProjectData,
  getBudgetsMeta,
  prepareBudgetAmounts
} from "./budgets.service.js";

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

  it("prepara dados de projeto a partir de orçamento aprovado", () => {
    expect(
      buildConvertedProjectData(
        {
          clientId: "clw0000000000000000000000",
          description: "Escopo aprovado",
          finalAmount: "3250",
          title: "Projeto de interiores"
        },
        {
          status: "CONTRACT_SIGNED",
          type: "INTERIORS"
        }
      )
    ).toEqual({
      area: undefined,
      clientId: "clw0000000000000000000000",
      contractedAmount: 3250,
      description: "Escopo aprovado",
      expectedDeliveryDate: undefined,
      internalNotes: undefined,
      name: "Projeto de interiores",
      notes: undefined,
      startsAt: undefined,
      status: "CONTRACT_SIGNED",
      type: "INTERIORS",
      workAddress: undefined
    });
  });

  it("bloqueia conversão incoerente de orçamento em projeto", () => {
    expect(() => assertBudgetCanBeConverted({ itemCount: 1, status: "SENT" })).not.toThrow();
    expect(() => assertBudgetCanBeConverted({ itemCount: 0, status: "SENT" })).toThrow("pelo menos 1 item");
    expect(() => assertBudgetCanBeConverted({ itemCount: 1, projectId: "project-1", status: "SENT" })).toThrow("vinculado");
    expect(() => assertBudgetCanBeConverted({ itemCount: 1, status: "CANCELLED" })).toThrow("não pode virar projeto");
  });
});
