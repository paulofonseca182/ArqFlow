import { describe, expect, it } from "vitest";
import { buildClientWhere, getClientsMeta } from "./clients.service.js";

describe("clients service", () => {
  it("retorna metadados de status de clientes", () => {
    const meta = getClientsMeta();

    expect(meta.statuses).toContainEqual({
      value: "NEW_CONTACT",
      label: "Novo contato"
    });
  });

  it("monta filtro por status", () => {
    expect(buildClientWhere({ status: "ACTIVE" })).toEqual({ status: "ACTIVE" });
  });

  it("monta busca por nome, email, telefone e WhatsApp", () => {
    expect(buildClientWhere({ search: "ana" })).toEqual({
      OR: [
        { name: { contains: "ana" } },
        { email: { contains: "ana" } },
        { phone: { contains: "ana" } },
        { whatsapp: { contains: "ana" } }
      ]
    });
  });

  it("combina busca com status", () => {
    expect(buildClientWhere({ search: "ana", status: "IN_SERVICE" })).toEqual({
      status: "IN_SERVICE",
      OR: [
        { name: { contains: "ana" } },
        { email: { contains: "ana" } },
        { phone: { contains: "ana" } },
        { whatsapp: { contains: "ana" } }
      ]
    });
  });
});
