import { describe, expect, it } from "vitest";
import { createProjectSchema, updateProjectSchema } from "./projects.schema.js";

const validClientId = "clw0000000000000000000000";

describe("projects schema", () => {
  it("exige cliente no cadastro", () => {
    const result = createProjectSchema.safeParse({
      name: "Apartamento Vila Mariana",
      type: "INTERIORS"
    });

    expect(result.success).toBe(false);
  });

  it("exige nome e tipo no cadastro", () => {
    expect(createProjectSchema.safeParse({ clientId: validClientId, type: "INTERIORS" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ clientId: validClientId, name: "Apartamento Vila Mariana" }).success).toBe(false);
  });

  it("bloqueia data de entrega anterior a data de inicio", () => {
    const result = createProjectSchema.safeParse({
      clientId: validClientId,
      name: "Apartamento Vila Mariana",
      type: "INTERIORS",
      startsAt: "2026-08-01",
      expectedDeliveryDate: "2026-07-01"
    });

    expect(result.success).toBe(false);
  });

  it("bloqueia valor contratado negativo ou zero", () => {
    expect(
      createProjectSchema.safeParse({
        clientId: validClientId,
        name: "Apartamento Vila Mariana",
        type: "INTERIORS",
        contractedAmount: 0
      }).success
    ).toBe(false);
  });

  it("normaliza campos opcionais vazios", () => {
    const result = createProjectSchema.parse({
      clientId: validClientId,
      name: "Apartamento Vila Mariana",
      type: "INTERIORS",
      workAddress: "",
      contractedAmount: ""
    });

    expect(result.workAddress).toBeUndefined();
    expect(result.contractedAmount).toBeUndefined();
  });

  it("permite update parcial com pelo menos um campo", () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
    expect(updateProjectSchema.safeParse({ status: "CONTRACT_SIGNED" }).success).toBe(true);
  });
});
