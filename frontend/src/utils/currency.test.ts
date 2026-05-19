import { describe, expect, it } from "vitest";
import { formatCurrency, maskCurrencyInput, parseCurrencyInput, toCurrencyInputValue } from "./currency";

function normalizeSpaces(value: string) {
  return value.replace(/\s/g, " ");
}

describe("currency utils", () => {
  it("formats typed digits as Brazilian Real cents", () => {
    expect(normalizeSpaces(maskCurrencyInput("5"))).toBe("R$ 0,05");
    expect(normalizeSpaces(maskCurrencyInput("55"))).toBe("R$ 0,55");
    expect(normalizeSpaces(maskCurrencyInput("555"))).toBe("R$ 5,55");
    expect(normalizeSpaces(maskCurrencyInput("55555"))).toBe("R$ 555,55");
  });

  it("parses masked values back to numbers", () => {
    expect(parseCurrencyInput("R$ 555,55")).toBe(555.55);
    expect(parseCurrencyInput("R$ 42.000,00")).toBe(42000);
  });

  it("formats persisted decimal values for inputs and displays", () => {
    expect(normalizeSpaces(toCurrencyInputValue("42000.00"))).toBe("R$ 42.000,00");
    expect(normalizeSpaces(formatCurrency("250.5"))).toBe("R$ 250,50");
    expect(normalizeSpaces(formatCurrency("250,5"))).toBe("R$ 250,50");
  });
});
