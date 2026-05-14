import { describe, expect, it } from "vitest";
import { createVisitSchema, listVisitsQuerySchema, updateVisitSchema } from "./visits.schema.js";

describe("visits schema", () => {
  it("valida criação de visita com cliente obrigatório e projeto opcional", () => {
    const parsed = createVisitSchema.parse({
      clientId: "clw0000000000000000000000",
      projectId: "",
      type: "TECHNICAL_VISIT",
      date: "2026-06-10",
      time: "09:30",
      amount: "1.200,50"
    });

    expect(parsed.clientId).toBe("clw0000000000000000000000");
    expect(parsed.projectId).toBeNull();
    expect(parsed.amount).toBe(1200.5);
    expect(parsed.status).toBe("SCHEDULED");
  });

  it("bloqueia cliente ausente, tipo inválido e valor não positivo", () => {
    expect(
      createVisitSchema.safeParse({
        type: "TECHNICAL_VISIT",
        date: "2026-06-10"
      }).success
    ).toBe(false);

    expect(
      createVisitSchema.safeParse({
        clientId: "clw0000000000000000000000",
        type: "CALL",
        date: "2026-06-10"
      }).success
    ).toBe(false);

    expect(
      createVisitSchema.safeParse({
        clientId: "clw0000000000000000000000",
        type: "TECHNICAL_VISIT",
        date: "2026-06-10",
        amount: 0
      }).success
    ).toBe(false);
  });

  it("valida horário no formato HH:mm", () => {
    expect(
      createVisitSchema.safeParse({
        clientId: "clw0000000000000000000000",
        type: "TECHNICAL_VISIT",
        date: "2026-06-10",
        time: "23:59"
      }).success
    ).toBe(true);

    expect(
      createVisitSchema.safeParse({
        clientId: "clw0000000000000000000000",
        type: "TECHNICAL_VISIT",
        date: "2026-06-10",
        time: "25:00"
      }).success
    ).toBe(false);
  });

  it("valida filtros por período", () => {
    expect(
      listVisitsQuerySchema.safeParse({
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30"
      }).success
    ).toBe(true);

    expect(
      listVisitsQuerySchema.safeParse({
        dateFrom: "2026-06-30",
        dateTo: "2026-06-01"
      }).success
    ).toBe(false);
  });

  it("exige ao menos um campo no update", () => {
    expect(updateVisitSchema.safeParse({}).success).toBe(false);
    expect(updateVisitSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
  });
});
