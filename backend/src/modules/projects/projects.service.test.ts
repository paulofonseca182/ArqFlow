import { describe, expect, it } from "vitest";
import { buildProjectWhere, getProjectsMeta } from "./projects.service.js";

describe("projects service", () => {
  it("retorna metadados de status e tipos de projeto", () => {
    const meta = getProjectsMeta();

    expect(meta.statuses).toContainEqual({
      value: "CONTRACT_IN_PROGRESS",
      label: "Contrato em andamento"
    });
    expect(meta.types).toContainEqual({
      value: "INTERIORS",
      label: "Interiores"
    });
  });

  it("monta filtros por cliente, status e tipo", () => {
    expect(
      buildProjectWhere({
        clientId: "clw0000000000000000000000",
        status: "CONTRACT_SIGNED",
        type: "INTERIORS"
      })
    ).toEqual({
      clientId: "clw0000000000000000000000",
      status: "CONTRACT_SIGNED",
      type: "INTERIORS"
    });
  });

  it("monta busca por nome, descricao, endereco e nome do cliente", () => {
    expect(buildProjectWhere({ search: "vila" })).toEqual({
      OR: [
        { name: { contains: "vila" } },
        { description: { contains: "vila" } },
        { workAddress: { contains: "vila" } },
        { client: { name: { contains: "vila" } } }
      ]
    });
  });
});
