import { describe, expect, it } from "vitest";
import {
  formatContactPhone,
  formatCellphone,
  isValidContactPhone,
  maskContactPhoneInput,
  maskCellphoneInput,
  normalizeContactPhone,
  onlyDigits
} from "./phone";

describe("phone utils", () => {
  it("formata telefone brasileiro com DDD", () => {
    expect(formatContactPhone("11999990000")).toBe("11 99999-0000");
    expect(formatContactPhone("1133330000")).toBe("11 3333-0000");
    expect(formatCellphone("11 99999-0000")).toBe("11 99999-0000");
  });

  it("mascara entrada brasileira progressiva", () => {
    expect(maskContactPhoneInput("11999990000")).toBe("11 99999-0000");
    expect(maskContactPhoneInput("1133330000")).toBe("11 3333-0000");
    expect(maskContactPhoneInput("11")).toBe("11");
    expect(maskCellphoneInput("11999")).toBe("11 999");
  });

  it("normaliza, valida e formata telefone internacional iniciado por +", () => {
    expect(maskContactPhoneInput("+1 305 555 0199")).toBe("+13055550199");
    expect(normalizeContactPhone("+1 305 555 0199")).toBe("+13055550199");
    expect(formatContactPhone("+13055550199")).toBe("+1 305 555-0199");
    expect(formatContactPhone("+55 37 99999-9999")).toBe("+55 37 99999-9999");
    expect(isValidContactPhone("+351 912 345 678")).toBe(true);
  });

  it("bloqueia telefone incompleto", () => {
    expect(isValidContactPhone("119999000")).toBe(false);
    expect(isValidContactPhone("+123")).toBe(false);
  });

  it("remove caracteres nao numericos", () => {
    expect(onlyDigits("11 99999-0000")).toBe("11999990000");
  });
});
