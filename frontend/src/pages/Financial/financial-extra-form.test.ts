import { describe, expect, it } from "vitest";
import { expenseFormSchema } from "./financial-extra-form";

describe("expense form", () => {
  it("aceita compra parcelada nova com parcelas sem id", () => {
    const result = expenseFormSchema.safeParse({
      paymentMode: "INSTALLMENT_PURCHASE",
      projectId: "",
      categoryId: "",
      cashAccountId: "",
      classification: "ASSET_PURCHASE",
      description: "Ar condicionado",
      supplier: "",
      costCenter: "",
      amount: "R$ 1.000,00",
      dueDate: "",
      purchaseDate: "2026-10-10",
      installmentCount: 5,
      firstDueDate: "2026-10-15",
      installments: [
        { description: "Ar condicionado - parcela 1/5", amount: "R$ 200,00", dueDate: "2026-10-15", installmentNumber: 1, paymentMethod: "", notes: "" },
        { description: "Ar condicionado - parcela 2/5", amount: "R$ 200,00", dueDate: "2026-11-15", installmentNumber: 2, paymentMethod: "", notes: "" },
        { description: "Ar condicionado - parcela 3/5", amount: "R$ 200,00", dueDate: "2026-12-15", installmentNumber: 3, paymentMethod: "", notes: "" },
        { description: "Ar condicionado - parcela 4/5", amount: "R$ 200,00", dueDate: "2027-01-15", installmentNumber: 4, paymentMethod: "", notes: "" },
        { description: "Ar condicionado - parcela 5/5", amount: "R$ 200,00", dueDate: "2027-02-15", installmentNumber: 5, paymentMethod: "", notes: "" }
      ],
      paymentMethod: "",
      recurring: false,
      notes: ""
    });

    expect(result.success).toBe(true);
  });
});
