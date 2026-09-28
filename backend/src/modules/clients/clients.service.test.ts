import { describe, expect, it } from "vitest";
import { buildClientWhere, getClientListOrderBy, getClientsMeta } from "./clients.service.js";

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

  it("ordena clientes do mais recente para o mais antigo", () => {
    expect(getClientListOrderBy()).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
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

  it("monta busca por telefone mascarado usando digitos", () => {
    expect(buildClientWhere({ search: "11 99999-0000" })).toEqual({
      OR: [
        { name: { contains: "11 99999-0000" } },
        { email: { contains: "11 99999-0000" } },
        { phone: { contains: "11 99999-0000" } },
        { whatsapp: { contains: "11 99999-0000" } },
        { phone: { contains: "11999990000" } },
        { whatsapp: { contains: "11999990000" } }
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
