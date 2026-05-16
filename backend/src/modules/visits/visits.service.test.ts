import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors.js";
import { assertVisitProjectBelongsToClient, buildVisitWhere, getVisitsMeta } from "./visits.service.js";

describe("visits service", () => {
  it("retorna metadados de status e tipos de visita", () => {
    const meta = getVisitsMeta();

    expect(meta.statuses).toContainEqual({
      value: "SCHEDULED",
      label: "Agendada"
    });
    expect(meta.types).toContainEqual({
      value: "TECHNICAL_VISIT",
      label: "Visita técnica"
    });
  });

  it("monta filtros por cliente, projeto, tipo, status e período", () => {
    const dateFrom = new Date(2026, 5, 1);
    const dateTo = new Date(2026, 5, 30);

    expect(
      buildVisitWhere({
        clientId: "clw0000000000000000000000",
        projectId: "clw0000000000000000000001",
        type: "TECHNICAL_VISIT",
        status: "SCHEDULED",
        dateFrom,
        dateTo
      })
    ).toEqual({
      clientId: "clw0000000000000000000000",
      projectId: "clw0000000000000000000001",
      type: "TECHNICAL_VISIT",
      status: "SCHEDULED",
      date: {
        gte: new Date(2026, 5, 1),
        lte: new Date(2026, 5, 30, 23, 59, 59, 999)
      }
    });
  });

  it("monta escopo de visitas próximas", () => {
    expect(buildVisitWhere({ scope: "UPCOMING_VISITS" }, new Date(2026, 4, 13))).toEqual({
      date: {
        gte: new Date(2026, 4, 13),
        lte: new Date(2026, 4, 20, 23, 59, 59, 999)
      },
      status: "SCHEDULED"
    });
  });

  it("monta busca por tipo, endereço, observações, cliente e projeto", () => {
    expect(buildVisitWhere({ search: "obra" })).toEqual({
      OR: [
        { type: { contains: "obra" } },
        { address: { contains: "obra" } },
        { notes: { contains: "obra" } },
        { client: { name: { contains: "obra" } } },
        { project: { name: { contains: "obra" } } }
      ]
    });
  });

  it("bloqueia projeto de outro cliente", () => {
    expect(() => assertVisitProjectBelongsToClient({ clientId: "client-2" }, "client-1")).toThrow(AppError);
    expect(() => assertVisitProjectBelongsToClient({ clientId: "client-1" }, "client-1")).not.toThrow();
  });
});
