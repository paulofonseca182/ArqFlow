import { describe, expect, it } from "vitest";
import { formatDateOnly, toDateParamValue, toLocalDateInputValue } from "./date";

describe("date utils", () => {
  it("mantem a data original de campos date-only enviados em UTC", () => {
    expect(formatDateOnly("2026-05-20T00:00:00.000Z")).toBe("20/05/2026");
    expect(toDateParamValue("2026-05-20T00:00:00.000Z")).toBe("2026-05-20");
  });

  it("aceita valores ja normalizados como yyyy-mm-dd", () => {
    expect(formatDateOnly("2026-05-28")).toBe("28/05/2026");
    expect(toDateParamValue("2026-05-28")).toBe("2026-05-28");
  });

  it("gera valor de input date usando calendario local", () => {
    expect(toLocalDateInputValue(new Date(2026, 4, 24))).toBe("2026-05-24");
  });
});
