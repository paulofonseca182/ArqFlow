import { describe, expect, it } from "vitest";
import { buildProjectWhere, getProjectsMeta } from "./projects.service.js";

describe("projects service", () => {
  it("retorna metadados de status e tipos de projeto", () => {
    const meta = getProjectsMeta();

    expect(meta.statuses).toContainEqual({
      value: "CONTRACT_IN_PROGRESS",
      label: "Contrato em andamento"
    });
    expect(meta.statuses.map((status) => status.value)).toEqual([
      "CONTRACT_IN_PROGRESS",
      "CONTRACT_SIGNED",
      "SURVEY_IN_PROGRESS",
      "ANTEPROJECT_IN_DEVELOPMENT",
      "WAITING_CLIENT_APPROVAL",
      "DESIGN_3D_IN_DEVELOPMENT",
      "EXECUTIVE_PROJECT_IN_DEVELOPMENT",
      "FINAL_DELIVERY",
      "FINISHED",
      "CANCELLED"
    ]);
    expect(meta.statuses).toContainEqual({
      value: "DESIGN_3D_IN_DEVELOPMENT",
      label: "Desenho 3D em desenvolvimento"
    });
    expect(meta.types).toContainEqual({
      value: "INTERIORS",
      label: "Interiores"
    });
    expect(meta.origins.map((origin) => origin.value)).toEqual(["BUDGET_APPROVAL", "LEGACY", "INTERNAL"]);
    expect(meta.manualReasons.map((reason) => reason.value)).toEqual(["LEGACY_PROJECT", "INTERNAL_PROJECT"]);
    expect(meta.origins.map((origin) => origin.value)).not.toContain("MANUAL");
    expect(meta.manualReasons.map((reason) => reason.value)).not.toContain("OTHER");
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

  it("monta busca por nome, descrição, endereço e nome do cliente", () => {
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
