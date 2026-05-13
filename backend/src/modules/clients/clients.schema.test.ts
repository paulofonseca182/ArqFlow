import { describe, expect, it } from "vitest";
import { createClientSchema, updateClientSchema } from "./clients.schema.js";

describe("clients schema", () => {
  it("exige nome no cadastro", () => {
    const result = createClientSchema.safeParse({ phone: "11999990000" });

    expect(result.success).toBe(false);
  });

  it("exige telefone ou WhatsApp no cadastro", () => {
    const result = createClientSchema.safeParse({ name: "Ana Ribeiro" });

    expect(result.success).toBe(false);
  });

  it("normaliza e-mail vazio como indefinido", () => {
    const result = createClientSchema.parse({
      name: "Ana Ribeiro",
      phone: "11999990000",
      email: ""
    });

    expect(result.email).toBeUndefined();
  });

  it("bloqueia e-mail inválido", () => {
    const result = createClientSchema.safeParse({
      name: "Ana Ribeiro",
      phone: "11999990000",
      email: "ana"
    });

    expect(result.success).toBe(false);
  });

  it("valida CPF/CNPJ quando preenchido", () => {
    expect(
      createClientSchema.safeParse({
        name: "Ana Ribeiro",
        phone: "11999990000",
        cpfCnpj: "111.111.111-11"
      }).success
    ).toBe(false);

    expect(
      createClientSchema.safeParse({
        name: "Ana Ribeiro",
        phone: "11999990000",
        cpfCnpj: "529.982.247-25"
      }).success
    ).toBe(true);
  });

  it("permite update parcial com pelo menos um campo", () => {
    expect(updateClientSchema.safeParse({}).success).toBe(false);
    expect(updateClientSchema.safeParse({ city: "Sao Paulo" }).success).toBe(true);
  });
});
