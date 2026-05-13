import { AppError } from "./errors.js";

type PaymentLike = {
  dueDate: Date;
  status: string;
};

export function assertPositiveAmount(value: number, fieldName = "valor") {
  if (!Number.isFinite(value) || value <= 0) {
    throw new AppError("INVALID_AMOUNT", `${fieldName} deve ser maior que zero.`, 422);
  }
}

export function calculateBudgetFinalAmount(items: Array<{ quantity: number; unitAmount: number }>, discount = 0) {
  if (items.length === 0) {
    throw new AppError("BUDGET_ITEMS_REQUIRED", "orçamento deve ter pelo menos um item.", 422);
  }

  const totalAmount = items.reduce((total, item) => {
    assertPositiveAmount(item.quantity, "quantidade");
    assertPositiveAmount(item.unitAmount, "valor unitário");
    return total + item.quantity * item.unitAmount;
  }, 0);

  if (discount < 0) {
    throw new AppError("INVALID_DISCOUNT", "desconto não pode ser negativo.", 422);
  }

  const finalAmount = totalAmount - discount;

  if (finalAmount <= 0) {
    throw new AppError("INVALID_FINAL_AMOUNT", "valor final deve ser maior que zero.", 422);
  }

  return { totalAmount, finalAmount };
}

export function calculateProjectProgress(totalSteps: number, completedSteps: number) {
  if (completedSteps < 0 || totalSteps < 0) {
    throw new AppError("INVALID_PROGRESS_INPUT", "quantidade de etapas não pode ser negativa.", 422);
  }

  if (completedSteps > totalSteps) {
    throw new AppError("INVALID_PROGRESS_INPUT", "etapas concluídas não podem ultrapassar o total.", 422);
  }

  if (totalSteps <= 0) {
    return 0;
  }

  return Math.round((completedSteps / totalSteps) * 100);
}

export function isPaymentOverdue(payment: PaymentLike, today = new Date()) {
  if (["PAID", "CANCELLED"].includes(payment.status)) {
    return false;
  }

  const dueDate = startOfDay(payment.dueDate);
  const referenceDate = startOfDay(today);

  return dueDate < referenceDate;
}

export function ensureDocumentHasOwner(clientId?: string | null, projectId?: string | null) {
  if (!clientId && !projectId) {
    throw new AppError("DOCUMENT_OWNER_REQUIRED", "documento deve estar vinculado a cliente e/ou projeto.", 422);
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
