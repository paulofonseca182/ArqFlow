import { describe, expect, it } from "vitest";
import { getBooleanSearchParam, getDateSearchParam, getEnumSearchParam, getStringSearchParam } from "./searchParams";

describe("search params helpers", () => {
  it("lê textos normalizados", () => {
    const searchParams = new URLSearchParams({ search: "  ana  " });

    expect(getStringSearchParam(searchParams, "search")).toBe("ana");
    expect(getStringSearchParam(searchParams, "missing")).toBe("");
  });

  it("valida enums antes de aplicar filtros", () => {
    const validParams = new URLSearchParams({ status: "APPROVED" });
    const invalidParams = new URLSearchParams({ status: "UNKNOWN" });

    expect(getEnumSearchParam(validParams, "status", ["APPROVED", "REFUSED"] as const)).toBe("APPROVED");
    expect(getEnumSearchParam(invalidParams, "status", ["APPROVED", "REFUSED"] as const)).toBe("");
  });

  it("valida datas absolutas em formato yyyy-mm-dd", () => {
    expect(getDateSearchParam(new URLSearchParams({ dueFrom: "2026-05-01" }), "dueFrom")).toBe("2026-05-01");
    expect(getDateSearchParam(new URLSearchParams({ dueFrom: "2026-02-31" }), "dueFrom")).toBe("");
    expect(getDateSearchParam(new URLSearchParams({ dueFrom: "31/02/2026" }), "dueFrom")).toBe("");
  });

  it("lê booleanos de atalhos derivados", () => {
    expect(getBooleanSearchParam(new URLSearchParams({ overdue: "true" }), "overdue")).toBe(true);
    expect(getBooleanSearchParam(new URLSearchParams({ overdue: "1" }), "overdue")).toBe(true);
    expect(getBooleanSearchParam(new URLSearchParams({ overdue: "false" }), "overdue")).toBe(false);
  });
});
