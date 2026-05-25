import { describe, expect, it } from "vitest";
import { createProjectSchema, updateProjectSchema } from "./projects.schema.js";

const validClientId = "clw0000000000000000000000";
const manualLegacy = {
  manualReason: "LEGACY_PROJECT",
  notes: "Projeto migrado para o ArqFlow.",
  origin: "LEGACY",
  startsAt: "2026-01-10",
  status: "CONTRACT_SIGNED"
} as const;
const manualInternal = {
  description: "Organizacao interna do escritorio.",
  manualReason: "INTERNAL_PROJECT",
  origin: "INTERNAL",
  status: "CONTRACT_IN_PROGRESS"
} as const;

describe("projects schema", () => {
  it("exige cliente no cadastro", () => {
    const result = createProjectSchema.safeParse({
      ...manualLegacy,
      name: "Apartamento Vila Mariana",
      type: "INTERIORS"
    });

    expect(result.success).toBe(false);
  });

  it("exige nome, tipo e status no cadastro", () => {
    expect(createProjectSchema.safeParse({ ...manualLegacy, clientId: validClientId, type: "INTERIORS" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ ...manualLegacy, clientId: validClientId, name: "Apartamento Vila Mariana" }).success).toBe(false);
    expect(
      createProjectSchema.safeParse({
        ...manualLegacy,
        clientId: validClientId,
        name: "Apartamento Vila Mariana",
        status: undefined,
        type: "INTERIORS"
      }).success
    ).toBe(false);
  });

  it("bloqueia data de entrega anterior a data de inicio", () => {
    const result = createProjectSchema.safeParse({
      ...manualLegacy,
      clientId: validClientId,
      expectedDeliveryDate: "2026-07-01",
      name: "Apartamento Vila Mariana",
      startsAt: "2026-08-01",
      type: "INTERIORS"
    });

    expect(result.success).toBe(false);
  });

  it("bloqueia valor contratado negativo ou zero", () => {
    expect(
      createProjectSchema.safeParse({
        ...manualLegacy,
        clientId: validClientId,
        contractedAmount: 0,
        name: "Apartamento Vila Mariana",
        type: "INTERIORS"
      }).success
    ).toBe(false);
  });

  it("bloqueia origem manual generica", () => {
    expect(
      createProjectSchema.safeParse({
        ...manualLegacy,
        clientId: validClientId,
        name: "Apartamento Vila Mariana",
        origin: "MANUAL",
        type: "INTERIORS"
      }).success
    ).toBe(false);
  });

  it("bloqueia origem por orcamento aprovado no cadastro manual", () => {
    expect(
      createProjectSchema.safeParse({
        ...manualLegacy,
        clientId: validClientId,
        name: "Apartamento Vila Mariana",
        origin: "BUDGET_APPROVAL",
        type: "INTERIORS"
      }).success
    ).toBe(false);
  });

  it("bloqueia motivos manuais antigos", () => {
    expect(
      createProjectSchema.safeParse({
        ...manualLegacy,
        clientId: validClientId,
        manualReason: "OTHER",
        name: "Apartamento Vila Mariana",
        type: "INTERIORS"
      }).success
    ).toBe(false);
  });

  it("exige data original e justificativa para projeto legado", () => {
    expect(
      createProjectSchema.safeParse({
        ...manualLegacy,
        clientId: validClientId,
        name: "Apartamento Vila Mariana",
        notes: "",
        type: "INTERIORS"
      }).success
    ).toBe(false);
    expect(
      createProjectSchema.safeParse({
        ...manualLegacy,
        clientId: validClientId,
        name: "Apartamento Vila Mariana",
        startsAt: "",
        type: "INTERIORS"
      }).success
    ).toBe(false);
  });

  it("exige descricao para projeto interno", () => {
    expect(
      createProjectSchema.safeParse({
        ...manualInternal,
        clientId: validClientId,
        description: "",
        name: "Manual interno",
        type: "OTHER"
      }).success
    ).toBe(false);
  });

  it("aceita projeto interno com motivo correto", () => {
    expect(
      createProjectSchema.safeParse({
        ...manualInternal,
        clientId: validClientId,
        name: "Manual interno",
        type: "OTHER"
      }).success
    ).toBe(true);
  });

  it("normaliza campos opcionais vazios", () => {
    const result = createProjectSchema.parse({
      ...manualLegacy,
      clientId: validClientId,
      contractedAmount: "",
      name: "Apartamento Vila Mariana",
      type: "INTERIORS",
      workAddress: ""
    });

    expect(result.workAddress).toBeUndefined();
    expect(result.contractedAmount).toBeUndefined();
  });

  it("permite update parcial com pelo menos um campo", () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
    expect(updateProjectSchema.safeParse({ status: "CONTRACT_SIGNED" }).success).toBe(true);
  });
});
