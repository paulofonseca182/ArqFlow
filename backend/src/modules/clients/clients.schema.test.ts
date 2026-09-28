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

  it("normaliza telefone brasileiro mascarado e bloqueia telefone incompleto", () => {
    const valid = createClientSchema.parse({
      name: "Ana Ribeiro",
      phone: "11 99999-0000"
    });

    expect(valid.phone).toBe("11999990000");

    const fixedLine = createClientSchema.parse({
      name: "Ana Ribeiro",
      phone: "11 3333-0000"
    });

    expect(fixedLine.phone).toBe("1133330000");

    expect(
      createClientSchema.safeParse({
        name: "Ana Ribeiro",
        phone: "11 999-0000"
      }).success
    ).toBe(false);
  });

  it("normaliza e valida telefone internacional iniciado por +", () => {
    const result = createClientSchema.parse({
      name: "Ana Ribeiro",
      whatsapp: "+1 305 555 0199"
    });

    expect(result.whatsapp).toBe("+13055550199");

    expect(
      createClientSchema.safeParse({
        name: "Ana Ribeiro",
        whatsapp: "+123"
      }).success
    ).toBe(false);
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
