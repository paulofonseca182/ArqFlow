import { describe, expect, it } from "vitest";
import { clientFormSchema, normalizeClientPayload } from "./client-form";

describe("client form", () => {
  it("aceita telefone brasileiro com DDD e normaliza payload", () => {
    const result = clientFormSchema.parse({
      name: "Ana Ribeiro",
      status: "NEW_CONTACT",
      phone: "11 3333-0000",
      whatsapp: "",
      email: "",
      cpfCnpj: "",
      address: "",
      city: "",
      state: "",
      source: "",
      notes: ""
    });

    expect(normalizeClientPayload(result).phone).toBe("1133330000");
  });

  it("aceita WhatsApp internacional iniciado por +", () => {
    const result = clientFormSchema.parse({
      name: "Ana Ribeiro",
      status: "NEW_CONTACT",
      phone: "",
      whatsapp: "+1 305 555 0199",
      email: "",
      cpfCnpj: "",
      address: "",
      city: "",
      state: "",
      source: "",
      notes: ""
    });

    expect(normalizeClientPayload(result).whatsapp).toBe("+13055550199");
  });

  it("bloqueia contato incompleto", () => {
    const result = clientFormSchema.safeParse({
      name: "Ana Ribeiro",
      status: "NEW_CONTACT",
      phone: "+123",
      whatsapp: "",
      email: "",
      cpfCnpj: "",
      address: "",
      city: "",
      state: "",
      source: "",
      notes: ""
    });

    expect(result.success).toBe(false);
  });
});
