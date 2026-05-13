import { describe, expect, it } from "vitest";
import {
  buildPaymentWhere,
  buildProjectFinancialSummary,
  getEffectivePaymentStatus,
  getFinancialMeta,
  resolveRegisteredPaymentData,
  splitAmountIntoInstallments
} from "./financial.service.js";

describe("financial service", () => {
  it("retorna metadados financeiros oficiais", () => {
    const meta = getFinancialMeta();

    expect(meta.statuses).toContainEqual({
      value: "RECEIVABLE",
      label: "A receber"
    });
    expect(meta.methods).toContainEqual({
      value: "PIX",
      label: "Pix"
    });
  });

  it("divide o valor contratado em parcelas sem perder centavos", () => {
    expect(splitAmountIntoInstallments(100, 3)).toEqual([33.34, 33.33, 33.33]);
    expect(splitAmountIntoInstallments(100, 2)).toEqual([50, 50]);
    expect(() => splitAmountIntoInstallments(100, 4)).toThrow("parcelamento");
  });

  it("calcula status atrasado dinamicamente", () => {
    expect(
      getEffectivePaymentStatus({ dueDate: new Date("2026-05-10"), status: "RECEIVABLE" }, new Date("2026-05-13"))
    ).toBe("OVERDUE");
    expect(getEffectivePaymentStatus({ dueDate: new Date("2026-05-10"), status: "PAID" }, new Date("2026-05-13"))).toBe(
      "PAID"
    );
  });

  it("monta filtro de parcelas atrasadas", () => {
    const today = new Date(2026, 4, 13);

    expect(buildPaymentWhere({ status: "OVERDUE" }, today)).toEqual({
      dueDate: {
        lt: today
      },
      status: {
        notIn: ["PAID", "CANCELLED"]
      }
    });
  });

  it("registra pagamento e bloqueia data futura ou valor acima da parcela", () => {
    expect(resolveRegisteredPaymentData({ amount: 1000 }, new Date("2026-05-13"))).toEqual({
      paidAmount: 1000,
      paidAt: new Date("2026-05-13"),
      status: "PAID"
    });

    expect(resolveRegisteredPaymentData({ amount: 1000, paidAmount: 300 }, new Date("2026-05-13"))).toEqual({
      paidAmount: 300,
      paidAt: new Date("2026-05-13"),
      status: "PARTIALLY_PAID"
    });

    expect(() =>
      resolveRegisteredPaymentData({ amount: 1000, paidAmount: 1200 }, new Date("2026-05-13"))
    ).toThrow("maior");
    expect(() =>
      resolveRegisteredPaymentData({ amount: 1000, paidAt: new Date("2026-05-14") }, new Date("2026-05-13"))
    ).toThrow("futura");
  });

  it("calcula resumo financeiro do projeto e alerta parcelas acima do contratado", () => {
    expect(
      buildProjectFinancialSummary(
        {
          contractedAmount: "1000",
          payments: [
            { amount: "700", paidAmount: "300", dueDate: new Date("2026-05-10"), status: "PARTIALLY_PAID" },
            { amount: "500", paidAmount: "0", dueDate: new Date("2026-05-20"), status: "RECEIVABLE" },
            { amount: "100", paidAmount: "0", dueDate: new Date("2026-05-20"), status: "CANCELLED" }
          ]
        },
        new Date("2026-05-13")
      )
    ).toEqual({
      contractedAmount: 1000,
      scheduledAmount: 1200,
      receivedAmount: 300,
      pendingAmount: 900,
      overdueAmount: 400,
      overContractedAmount: 200,
      hasOverContractedAlert: true
    });
  });
});
