import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { assertPositiveAmount, isPaymentOverdue } from "../../shared/business-rules.js";
import {
  cashAccountTypeLabels,
  cashMovementOriginLabels,
  cashMovementOrigins,
  cashMovementTypeLabels,
  cashMovementTypes,
  expenseClassificationLabels,
  expenseClassifications,
  expenseEntryTypeLabels,
  expenseEntryTypes,
  expenseStatusLabels,
  expenseStatuses,
  financialCategoryTypeLabels,
  financialCategoryTypes,
  paymentMethodLabels,
  paymentMethods,
  paymentStatusLabels,
  paymentStatuses,
  visitTypeLabels,
  type ExpenseStatus,
  type PaymentStatus
} from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import { maxInstallmentCount } from "./financial.schema.js";
import type {
  CreatePaymentInput,
  CashPeriodQuery,
  CreateExpenseInput,
  GenerateInstallmentsInput,
  ListCashMovementsQuery,
  ListExpensesQuery,
  ListFinancialCategoriesQuery,
  ListPaymentsQuery,
  ManualCashMovementInput,
  PayExpenseInput,
  ReorganizeExpenseInstallmentsInput,
  ReorganizeInstallmentsInput,
  RegisterPaymentInput,
  UpdateExpenseInput,
  UpdatePaymentInput
} from "./financial.schema.js";

type PaymentFinancialSnapshot = {
  amount: { toString(): string } | number | string;
  paidAmount: { toString(): string } | number | string;
  dueDate: Date;
  source?: string | null;
  status: string;
};

type ProjectFinancialSnapshot = {
  contractedAmount: { toString(): string } | number | string | null;
  payments: PaymentFinancialSnapshot[];
};

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

type VisitPaymentSnapshot = {
  amount: { toString(): string } | number | string | null | undefined;
  clientId: string;
  date: Date;
  id: string;
  projectId: string | null | undefined;
  status: string;
  type: string;
};

type PaymentListSortSnapshot = {
  createdAt: Date;
  dueDate: Date;
  status: string;
};

type ReorganizedInstallmentSnapshot = ReorganizeInstallmentsInput["installments"][number];

const defaultCashAccountId = "acc-main-cash";
const projectRevenueCategoryId = "cat-revenue-project-architecture";
const visitRevenueCategoryId = "cat-revenue-technical-visit";
const manualRevenueCategoryId = "cat-revenue-adjustment";
const defaultExpenseCategoryId = "cat-expense-other";

const paymentSelect = {
  id: true,
  projectId: true,
  clientId: true,
  visitId: true,
  categoryId: true,
  cashAccountId: true,
  source: true,
  description: true,
  amount: true,
  paidAmount: true,
  installment: true,
  dueDate: true,
  paidAt: true,
  paymentMethod: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsapp: true
    }
  },
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      contractedAmount: true
    }
  },
  category: {
    select: {
      id: true,
      name: true,
      type: true
    }
  },
  cashAccount: {
    select: {
      id: true,
      name: true,
      type: true
    }
  }
} satisfies Prisma.PaymentSelect;

type PaymentRecord = Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>;

const expenseSelect = {
  id: true,
  parentExpenseId: true,
  projectId: true,
  clientId: true,
  categoryId: true,
  cashAccountId: true,
  entryType: true,
  classification: true,
  description: true,
  supplier: true,
  costCenter: true,
  amount: true,
  dueDate: true,
  purchaseDate: true,
  paidAmount: true,
  paidAt: true,
  paymentMethod: true,
  status: true,
  installmentNumber: true,
  installmentCount: true,
  recurring: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      type: true
    }
  },
  cashAccount: {
    select: {
      id: true,
      name: true,
      type: true
    }
  },
  client: {
    select: {
      id: true,
      name: true
    }
  },
  project: {
    select: {
      id: true,
      name: true
    }
  },
  payments: {
    select: {
      id: true,
      amount: true,
      paidAt: true,
      paymentMethod: true,
      cashAccountId: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      cashAccount: {
        select: {
          id: true,
          name: true,
          type: true
        }
      },
      cashMovement: {
        select: {
          id: true,
          date: true,
          amount: true
        }
      }
    },
    orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }]
  },
  installments: {
    select: {
      id: true,
      parentExpenseId: true,
      projectId: true,
      clientId: true,
      categoryId: true,
      cashAccountId: true,
      entryType: true,
      classification: true,
      description: true,
      supplier: true,
      costCenter: true,
      amount: true,
      dueDate: true,
      purchaseDate: true,
      paidAmount: true,
      paidAt: true,
      paymentMethod: true,
      status: true,
      installmentNumber: true,
      installmentCount: true,
      recurring: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          type: true
        }
      },
      cashAccount: {
        select: {
          id: true,
          name: true,
          type: true
        }
      },
      client: {
        select: {
          id: true,
          name: true
        }
      },
      project: {
        select: {
          id: true,
          name: true
        }
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paidAt: true,
          paymentMethod: true,
          cashAccountId: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          cashAccount: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          cashMovement: {
            select: {
              id: true,
              date: true,
              amount: true
            }
          }
        },
        orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }]
      }
    },
    orderBy: [{ installmentNumber: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.ExpenseSelect;

const cashMovementSelect = {
  id: true,
  paymentId: true,
  expenseId: true,
  expensePaymentId: true,
  visitId: true,
  clientId: true,
  projectId: true,
  categoryId: true,
  cashAccountId: true,
  type: true,
  date: true,
  description: true,
  amount: true,
  paymentMethod: true,
  origin: true,
  referenceId: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      type: true
    }
  },
  cashAccount: {
    select: {
      id: true,
      name: true,
      type: true
    }
  },
  client: {
    select: {
      id: true,
      name: true
    }
  },
  project: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.CashMovementSelect;

const financialCategorySelect = {
  id: true,
  name: true,
  type: true,
  costCenter: true,
  active: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.FinancialCategorySelect;

const cashAccountSelect = {
  id: true,
  name: true,
  type: true,
  openingBalance: true,
  active: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.CashAccountSelect;

type ExpenseRecord = Prisma.ExpenseGetPayload<{ select: typeof expenseSelect }>;
type CashMovementRecord = Prisma.CashMovementGetPayload<{ select: typeof cashMovementSelect }>;
type FinancialCategoryRecord = Prisma.FinancialCategoryGetPayload<{ select: typeof financialCategorySelect }>;
type CashAccountRecord = Prisma.CashAccountGetPayload<{ select: typeof cashAccountSelect }>;

const projectFinancialSelect = {
  id: true,
  name: true,
  contractedAmount: true,
  payments: {
    where: {
      source: "PROJECT"
    },
    select: {
      amount: true,
      paidAmount: true,
      dueDate: true,
      status: true
    }
  }
} satisfies Prisma.ProjectSelect;

type ProjectFinancialRecord = Prisma.ProjectGetPayload<{ select: typeof projectFinancialSelect }>;

export async function getFinancialMeta() {
  const [categories, cashAccounts] = await prisma.$transaction([
    prisma.financialCategory.findMany({
      select: financialCategorySelect,
      orderBy: [{ type: "asc" }, { name: "asc" }]
    }),
    prisma.cashAccount.findMany({
      select: cashAccountSelect,
      orderBy: [{ active: "desc" }, { name: "asc" }]
    })
  ]);

  return {
    statuses: paymentStatuses.map((value) => ({
      value,
      label: paymentStatusLabels[value]
    })),
    methods: paymentMethods.map((value) => ({
      value,
      label: paymentMethodLabels[value]
    })),
    expenseStatuses: expenseStatuses.map((value) => ({
      value,
      label: expenseStatusLabels[value]
    })),
    expenseEntryTypes: expenseEntryTypes.map((value) => ({
      value,
      label: expenseEntryTypeLabels[value]
    })),
    expenseClassifications: expenseClassifications.map((value) => ({
      value,
      label: expenseClassificationLabels[value]
    })),
    categoryTypes: financialCategoryTypes.map((value) => ({
      value,
      label: financialCategoryTypeLabels[value]
    })),
    cashMovementTypes: cashMovementTypes.map((value) => ({
      value,
      label: cashMovementTypeLabels[value]
    })),
    cashMovementOrigins: cashMovementOrigins.map((value) => ({
      value,
      label: cashMovementOriginLabels[value]
    })),
    cashAccountTypes: Object.entries(cashAccountTypeLabels).map(([value, label]) => ({
      value,
      label
    })),
    categories: categories.map(mapFinancialCategory),
    cashAccounts: cashAccounts.map(mapCashAccount)
  };
}

export async function listPayments(query: ListPaymentsQuery) {
  const { page, pageSize } = query;
  const where = buildPaymentWhere(query);
  const today = new Date();

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      select: paymentSelect,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    }),
    prisma.payment.count({ where })
  ]);
  const start = (page - 1) * pageSize;
  const paginatedPayments = [...payments].sort((first, second) => comparePaymentsForFinancialList(first, second, today)).slice(start, start + pageSize);

  return {
    data: paginatedPayments.map(mapPayment),
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function getFinancialSummary() {
  const [payments, budgets, projects, expenses, cashMovements, cashAccounts] = await prisma.$transaction([
    prisma.payment.findMany({
      select: {
        amount: true,
        paidAmount: true,
        dueDate: true,
        paidAt: true,
        status: true
      }
    }),
    prisma.budget.findMany({
      select: {
        status: true
      }
    }),
    prisma.project.findMany({
      select: {
        contractedAmount: true
      }
    }),
    prisma.expense.findMany({
      select: {
        amount: true,
        dueDate: true,
        entryType: true,
        paidAmount: true,
        paidAt: true,
        status: true
      }
    }),
    prisma.cashMovement.findMany({
      select: {
        amount: true,
        date: true,
        type: true
      }
    }),
    prisma.cashAccount.findMany({
      select: {
        openingBalance: true
      }
    })
  ]);

  const today = startOfDay(new Date());
  const dueSoonLimit = addDays(today, 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const yearEnd = endOfDay(new Date(today.getFullYear(), 11, 31));

  let revenueMonth = 0;
  let revenueYear = 0;
  let receivableAmount = 0;
  let receivedAmount = 0;
  let expectedRevenueMonth = 0;
  let expectedRevenueYear = 0;
  let overdueAmount = 0;
  let dueSoonAmount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  let expectedExpenseMonth = 0;
  let expectedExpenseYear = 0;
  let paidExpenseMonth = 0;
  let paidExpenseYear = 0;
  let payableExpenseAmount = 0;
  let overdueExpenseAmount = 0;
  let dueSoonExpenseAmount = 0;
  let overdueExpenseCount = 0;
  let dueSoonExpenseCount = 0;
  let cashInflow = 0;
  let cashOutflow = 0;

  for (const payment of payments) {
    const amount = toNumber(payment.amount);
    const paidAmount = toNumber(payment.paidAmount);
    const remainingAmount = roundMoney(Math.max(amount - paidAmount, 0));
    const effectiveStatus = getEffectivePaymentStatus(payment, today);

    if (!["PAID", "CANCELLED"].includes(payment.status)) {
      receivableAmount += remainingAmount;

      if (payment.dueDate >= monthStart && payment.dueDate <= monthEnd) {
        expectedRevenueMonth += remainingAmount;
      }

      if (payment.dueDate >= yearStart && payment.dueDate <= yearEnd) {
        expectedRevenueYear += remainingAmount;
      }
    }

    if (effectiveStatus === "OVERDUE") {
      overdueAmount += remainingAmount;
      overdueCount += 1;
    }

    if (
      !["PAID", "CANCELLED"].includes(payment.status) &&
      startOfDay(payment.dueDate) >= today &&
      startOfDay(payment.dueDate) <= dueSoonLimit
    ) {
      dueSoonAmount += remainingAmount;
      dueSoonCount += 1;
    }
  }

  for (const expense of expenses) {
    if (!isExpensePayableLeaf(expense)) {
      continue;
    }

    const dueDate = expense.dueDate;
    const remainingAmount = getExpenseRemainingAmount(expense);
    const effectiveStatus = getEffectiveExpenseStatus(expense, today);

    if (expense.status !== "CANCELLED" && remainingAmount > 0 && dueDate) {
      if (dueDate >= monthStart && dueDate <= monthEnd) {
        expectedExpenseMonth += remainingAmount;
      }

      if (dueDate >= yearStart && dueDate <= yearEnd) {
        expectedExpenseYear += remainingAmount;
      }
    }

    if (!["PAID", "CANCELLED"].includes(expense.status)) {
      payableExpenseAmount += remainingAmount;
    }

    if (effectiveStatus === "OVERDUE") {
      overdueExpenseAmount += remainingAmount;
      overdueExpenseCount += 1;
    }

    if (
      !["PAID", "CANCELLED"].includes(expense.status) &&
      dueDate &&
      startOfDay(dueDate) >= today &&
      startOfDay(dueDate) <= dueSoonLimit
    ) {
      dueSoonExpenseAmount += remainingAmount;
      dueSoonExpenseCount += 1;
    }
  }

  for (const movement of cashMovements) {
    const amount = toNumber(movement.amount);

    if (movement.type === "INCOME") {
      cashInflow += amount;
      receivedAmount += amount;

      if (movement.date >= monthStart && movement.date <= monthEnd) {
        revenueMonth += amount;
      }

      if (movement.date >= yearStart && movement.date <= yearEnd) {
        revenueYear += amount;
      }

      continue;
    }

    cashOutflow += amount;

    if (movement.date >= monthStart && movement.date <= monthEnd) {
      paidExpenseMonth += amount;
    }

    if (movement.date >= yearStart && movement.date <= yearEnd) {
      paidExpenseYear += amount;
    }
  }

  const approvedBudgets = budgets.filter((budget) => budget.status === "APPROVED").length;
  const refusedBudgets = budgets.filter((budget) => budget.status === "REFUSED").length;
  const ticketAmounts = projects.map((project) => toNumber(project.contractedAmount)).filter((value) => value > 0);
  const averageProjectTicket =
    ticketAmounts.length > 0 ? ticketAmounts.reduce((total, amount) => total + amount, 0) / ticketAmounts.length : 0;
  const openingBalance = cashAccounts.reduce((total, account) => total + toNumber(account.openingBalance), 0);
  const cashBalance = roundMoney(openingBalance + cashInflow - cashOutflow);

  return {
    revenueMonth: toMoneyString(revenueMonth),
    revenueYear: toMoneyString(revenueYear),
    receivableAmount: toMoneyString(receivableAmount),
    receivedAmount: toMoneyString(receivedAmount),
    expectedRevenueMonth: toMoneyString(expectedRevenueMonth),
    expectedRevenueYear: toMoneyString(expectedRevenueYear),
    expectedExpenseMonth: toMoneyString(expectedExpenseMonth),
    expectedExpenseYear: toMoneyString(expectedExpenseYear),
    paidExpenseMonth: toMoneyString(paidExpenseMonth),
    paidExpenseYear: toMoneyString(paidExpenseYear),
    payableExpenseAmount: toMoneyString(payableExpenseAmount),
    overdueExpenseAmount: toMoneyString(overdueExpenseAmount),
    dueSoonExpenseAmount: toMoneyString(dueSoonExpenseAmount),
    overdueExpenseCount,
    dueSoonExpenseCount,
    expectedBalanceMonth: toMoneyString(expectedRevenueMonth - expectedExpenseMonth),
    realizedBalanceMonth: toMoneyString(revenueMonth - paidExpenseMonth),
    cashBalance: toMoneyString(cashBalance),
    overdueAmount: toMoneyString(overdueAmount),
    dueSoonAmount: toMoneyString(dueSoonAmount),
    overdueCount,
    dueSoonCount,
    approvedBudgets,
    refusedBudgets,
    averageProjectTicket: toMoneyString(averageProjectTicket)
  };
}

export async function listFinancialCategories(query: ListFinancialCategoriesQuery) {
  const categories = await prisma.financialCategory.findMany({
    where: {
      ...(query.type ? { type: query.type } : {})
    },
    select: financialCategorySelect,
    orderBy: [{ type: "asc" }, { name: "asc" }]
  });

  return categories.map(mapFinancialCategory);
}

export async function listCashAccounts() {
  const accounts = await prisma.cashAccount.findMany({
    select: cashAccountSelect,
    orderBy: [{ active: "desc" }, { name: "asc" }]
  });

  return accounts.map(mapCashAccount);
}

export async function listExpenses(query: ListExpensesQuery) {
  const { page, pageSize } = query;
  const where = buildExpenseWhere(query);
  const today = new Date();

  const [expenses, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where,
      select: expenseSelect,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    }),
    prisma.expense.count({ where })
  ]);
  const start = (page - 1) * pageSize;
  const paginatedExpenses = [...expenses]
    .sort((first, second) => compareExpensesForFinancialList(first, second, today))
    .slice(start, start + pageSize);

  return {
    data: paginatedExpenses.map((expense) => mapExpense(expense, today)),
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function createExpense(input: CreateExpenseInput) {
  assertPositiveAmount(input.amount);

  return prisma.$transaction(async (transaction) => {
    const clientId = await resolveExpenseClientId(input, transaction);
    const categoryId = input.categoryId ?? defaultExpenseCategoryId;
    const cashAccountId = input.cashAccountId ?? defaultCashAccountId;
    const classification = input.classification ?? "OPERATIONAL_EXPENSE";

    if (input.installments && input.installments.length > 0) {
      assertExpenseInstallmentsMatchTotal(input.amount, input.installments);

      const parent = await transaction.expense.create({
        data: {
          projectId: input.projectId,
          clientId,
          categoryId,
          cashAccountId,
          entryType: "PURCHASE",
          classification,
          description: input.description,
          supplier: input.supplier,
          costCenter: input.costCenter,
          amount: input.amount,
          dueDate: null,
          purchaseDate: input.purchaseDate ?? new Date(),
          paidAmount: 0,
          paymentMethod: input.paymentMethod,
          recurring: false,
          installmentCount: input.installments.length,
          notes: input.notes,
          status: "PENDING"
        },
        select: {
          id: true
        }
      });

      for (const [index, installment] of input.installments.entries()) {
        await transaction.expense.create({
          data: {
            parentExpenseId: parent.id,
            projectId: input.projectId,
            clientId,
            categoryId,
            cashAccountId,
            entryType: "INSTALLMENT",
            classification,
            description: installment.description ?? `${input.description} - parcela ${index + 1}/${input.installments.length}`,
            supplier: input.supplier,
            costCenter: input.costCenter,
            amount: installment.amount,
            dueDate: installment.dueDate,
            purchaseDate: input.purchaseDate ?? new Date(),
            paidAmount: 0,
            paymentMethod: installment.paymentMethod ?? input.paymentMethod,
            recurring: false,
            installmentNumber: installment.installmentNumber ?? index + 1,
            installmentCount: input.installments.length,
            notes: installment.notes ?? input.notes,
            status: "PENDING"
          }
        });
      }

      const expense = await transaction.expense.findUniqueOrThrow({
        where: {
          id: parent.id
        },
        select: expenseSelect
      });

      return mapExpense(expense);
    }

    if (!input.dueDate) {
      throw new AppError("EXPENSE_DUE_DATE_REQUIRED", "Informe o vencimento da despesa.", 422);
    }

    const expense = await transaction.expense.create({
      data: {
        projectId: input.projectId,
        clientId,
        categoryId,
        cashAccountId,
        entryType: "SINGLE",
        classification,
        description: input.description,
        supplier: input.supplier,
        costCenter: input.costCenter,
        amount: input.amount,
        dueDate: input.dueDate,
        purchaseDate: input.purchaseDate ?? input.dueDate,
        paidAmount: 0,
        paymentMethod: input.paymentMethod,
        recurring: input.recurring ?? false,
        installmentNumber: 1,
        installmentCount: 1,
        notes: input.notes,
        status: "PENDING"
      },
      select: expenseSelect
    });

    return mapExpense(expense);
  });
}

export async function updateExpense(id: string, input: UpdateExpenseInput) {
  return prisma.$transaction(async (transaction) => {
    const currentExpense = await transaction.expense.findUnique({
      where: { id },
      select: {
        id: true,
        entryType: true,
        paidAmount: true,
        projectId: true,
        status: true
      }
    });

    if (!currentExpense) {
      throw new AppError("EXPENSE_NOT_FOUND", "Despesa não encontrada.", 404);
    }

    if (currentExpense.status === "PAID") {
      throw new AppError("EXPENSE_PAID_UPDATE_BLOCKED", "Despesa paga não pode ser editada sem fluxo de estorno.", 409);
    }

    if (currentExpense.status === "CANCELLED") {
      throw new AppError("EXPENSE_CANCELLED_UPDATE_BLOCKED", "Despesa cancelada não pode ser editada.", 409);
    }

    const { entryType: _entryType, installments: _installments, ...expenseInput } = input;

    if (_installments) {
      throw new AppError(
        "EXPENSE_INSTALLMENTS_UPDATE_BLOCKED",
        "Use a reorganização de parcelas para alterar o plano de uma compra parcelada.",
        409
      );
    }

    if (_entryType) {
      throw new AppError("EXPENSE_ENTRY_TYPE_UPDATE_BLOCKED", "Tipo estrutural da despesa não pode ser alterado.", 409);
    }

    if (currentExpense.entryType === "PURCHASE" && (expenseInput.amount !== undefined || expenseInput.dueDate !== undefined)) {
      throw new AppError(
        "EXPENSE_PURCHASE_AMOUNT_UPDATE_BLOCKED",
        "Valor e vencimentos de compra parcelada devem ser alterados pela reorganização de parcelas.",
        409
      );
    }

    if (toNumber(currentExpense.paidAmount) > 0 && (expenseInput.amount !== undefined || expenseInput.dueDate !== undefined)) {
      throw new AppError(
        "EXPENSE_PAID_HISTORY_UPDATE_BLOCKED",
        "Parcela com pagamento registrado não pode alterar valor ou vencimento sem fluxo de estorno.",
        409
      );
    }

    if (expenseInput.amount !== undefined) {
      assertPositiveAmount(expenseInput.amount);
    }

    const clientId = await resolveExpenseClientId(expenseInput, transaction);

    const expense = await transaction.expense.update({
      where: { id },
      data: {
        ...expenseInput,
        ...(clientId !== undefined ? { clientId } : {})
      },
      select: expenseSelect
    });

    return mapExpense(expense);
  });
}

export async function payExpense(id: string, input: PayExpenseInput) {
  return prisma.$transaction(async (transaction) => {
    const currentExpense = await transaction.expense.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        cashAccountId: true,
        categoryId: true,
        clientId: true,
        description: true,
        entryType: true,
        parentExpenseId: true,
        paidAmount: true,
        paymentMethod: true,
        projectId: true,
        status: true
      }
    });

    if (!currentExpense) {
      throw new AppError("EXPENSE_NOT_FOUND", "Despesa não encontrada.", 404);
    }

    if (currentExpense.status === "CANCELLED") {
      throw new AppError("EXPENSE_CANCELLED_PAY_BLOCKED", "Despesa cancelada não pode ser paga.", 409);
    }

    if (currentExpense.status === "PAID") {
      throw new AppError("EXPENSE_ALREADY_PAID", "Despesa já está paga.", 409);
    }

    if (currentExpense.entryType === "PURCHASE") {
      throw new AppError(
        "EXPENSE_PURCHASE_PAY_BLOCKED",
        "Pague uma parcela da compra, não o lançamento principal.",
        409
      );
    }

    const paidAt = resolveActualDate(input.paidAt, new Date(), "Data de pagamento não pode ser futura.");
    const currentPaidAmount = toNumber(currentExpense.paidAmount);
    const totalAmount = toNumber(currentExpense.amount);
    const remainingAmount = roundMoney(totalAmount - currentPaidAmount);
    const nextPaidAmount = input.paidAmount ?? remainingAmount;

    assertPositiveAmount(nextPaidAmount, "valor pago");

    if (nextPaidAmount > remainingAmount) {
      throw new AppError(
        "EXPENSE_PAYMENT_AMOUNT_TOO_HIGH",
        "Valor pago não pode ser maior que o saldo pendente da parcela.",
        422,
        {
          remainingAmount: toMoneyString(remainingAmount),
          paidAmount: toMoneyString(nextPaidAmount)
        }
      );
    }

    const accumulatedPaidAmount = roundMoney(currentPaidAmount + nextPaidAmount);
    const paymentMethod = input.paymentMethod ?? currentExpense.paymentMethod;
    const cashAccountId = input.cashAccountId ?? currentExpense.cashAccountId ?? defaultCashAccountId;
    const status = accumulatedPaidAmount >= totalAmount ? "PAID" : "PARTIALLY_PAID";

    const expense = await transaction.expense.update({
      where: { id },
      data: {
        cashAccountId,
        paidAmount: accumulatedPaidAmount,
        paidAt: status === "PAID" ? paidAt : null,
        paymentMethod,
        status
      },
      select: expenseSelect
    });

    const expensePayment = await transaction.expensePayment.create({
      data: {
        amount: nextPaidAmount,
        cashAccountId,
        expenseId: currentExpense.id,
        notes: input.notes,
        paidAt,
        paymentMethod
      },
      select: {
        id: true
      }
    });

    await createExpenseCashMovement(transaction, {
      ...currentExpense,
      amount: nextPaidAmount,
      cashAccountId,
      expensePaymentId: expensePayment.id,
      paidAt,
      paymentMethod
    });

    if (currentExpense.parentExpenseId) {
      await refreshParentExpenseFromInstallments(transaction, currentExpense.parentExpenseId);
    }

    return {
      expense: mapExpense(expense),
      cashSummary: await getCashSummary({}, transaction)
    };
  });
}

export async function cancelExpense(id: string) {
  return prisma.$transaction(async (transaction) => {
    const currentExpense = await transaction.expense.findUnique({
      where: { id },
      select: {
        id: true,
        entryType: true,
        paidAmount: true,
        parentExpenseId: true,
        status: true
      }
    });

    if (!currentExpense) {
      throw new AppError("EXPENSE_NOT_FOUND", "Despesa não encontrada.", 404);
    }

    if (currentExpense.status === "PAID") {
      throw new AppError("EXPENSE_PAID_CANCEL_BLOCKED", "Despesa paga não pode ser cancelada sem fluxo de estorno.", 409);
    }

    if (toNumber(currentExpense.paidAmount) > 0) {
      throw new AppError(
        "EXPENSE_PAYMENT_CANCEL_BLOCKED",
        "Despesa com pagamento registrado não pode ser cancelada sem fluxo de estorno.",
        409
      );
    }

    if (currentExpense.entryType === "PURCHASE") {
      const installments = await transaction.expense.findMany({
        where: {
          parentExpenseId: currentExpense.id,
          status: {
            not: "CANCELLED"
          }
        },
        select: {
          paidAmount: true
        }
      });

      if (installments.some((installment) => toNumber(installment.paidAmount) > 0)) {
        throw new AppError(
          "EXPENSE_PURCHASE_CANCEL_BLOCKED",
          "Compra com parcela paga ou parcialmente paga não pode ser cancelada sem fluxo de estorno.",
          409
        );
      }

      await transaction.expense.updateMany({
        where: {
          parentExpenseId: currentExpense.id
        },
        data: {
          status: "CANCELLED"
        }
      });
    }

    const expense = await transaction.expense.update({
      where: { id },
      data: {
        status: "CANCELLED"
      },
      select: expenseSelect
    });

    if (currentExpense.parentExpenseId) {
      await refreshParentExpenseFromInstallments(transaction, currentExpense.parentExpenseId);
    }

    return mapExpense(expense);
  });
}

export async function deleteExpense(id: string) {
  return prisma.$transaction(async (transaction) => {
    const currentExpense = await transaction.expense.findUnique({
      where: { id },
      select: {
        id: true,
        entryType: true,
        paidAmount: true,
        parentExpenseId: true
      }
    });

    if (!currentExpense) {
      throw new AppError("EXPENSE_NOT_FOUND", "Despesa não encontrada.", 404);
    }

    if (currentExpense.parentExpenseId) {
      throw new AppError(
        "EXPENSE_INSTALLMENT_DELETE_BLOCKED",
        "Para preservar o plano financeiro, exclua a compra principal ou cancele esta parcela.",
        409
      );
    }

    const installmentExpenses =
      currentExpense.entryType === "PURCHASE"
        ? await transaction.expense.findMany({
            where: {
              parentExpenseId: currentExpense.id
            },
            select: {
              id: true,
              paidAmount: true
            }
          })
        : [];

    const expenseIds = [currentExpense.id, ...installmentExpenses.map((installment) => installment.id)];
    const hasPaidAmount =
      toNumber(currentExpense.paidAmount) > 0 || installmentExpenses.some((installment) => toNumber(installment.paidAmount) > 0);

    const [paymentCount, cashMovementCount] = await Promise.all([
      transaction.expensePayment.count({
        where: {
          expenseId: {
            in: expenseIds
          }
        }
      }),
      transaction.cashMovement.count({
        where: {
          expenseId: {
            in: expenseIds
          }
        }
      })
    ]);

    if (hasPaidAmount || paymentCount > 0 || cashMovementCount > 0) {
      throw new AppError(
        "EXPENSE_DELETE_PAYMENT_BLOCKED",
        "Despesa com pagamento ou movimentação de caixa não pode ser excluída. Use cancelar para preservar o histórico financeiro.",
        409
      );
    }

    if (currentExpense.entryType === "PURCHASE") {
      await transaction.expense.deleteMany({
        where: {
          parentExpenseId: currentExpense.id
        }
      });
    }

    await transaction.expense.delete({
      where: {
        id: currentExpense.id
      }
    });

    return { deleted: true };
  });
}

export async function reorganizeExpenseInstallments(id: string, input: ReorganizeExpenseInstallmentsInput) {
  return prisma.$transaction(async (transaction) => {
    const parentExpense = await transaction.expense.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        cashAccountId: true,
        categoryId: true,
        classification: true,
        clientId: true,
        costCenter: true,
        description: true,
        entryType: true,
        notes: true,
        paymentMethod: true,
        projectId: true,
        purchaseDate: true,
        status: true,
        supplier: true,
        installments: {
          where: {
            status: {
              not: "CANCELLED"
            }
          },
          select: {
            id: true,
            paidAmount: true
          }
        }
      }
    });

    if (!parentExpense) {
      throw new AppError("EXPENSE_NOT_FOUND", "Despesa não encontrada.", 404);
    }

    if (parentExpense.entryType !== "PURCHASE") {
      throw new AppError(
        "EXPENSE_REORGANIZE_PURCHASE_REQUIRED",
        "Somente compras parceladas podem ter parcelas reorganizadas.",
        422
      );
    }

    if (parentExpense.status === "CANCELLED") {
      throw new AppError("EXPENSE_CANCELLED_UPDATE_BLOCKED", "Despesa cancelada não pode ser reorganizada.", 409);
    }

    if (parentExpense.installments.some((installment) => toNumber(installment.paidAmount) > 0)) {
      throw new AppError(
        "EXPENSE_REORGANIZE_PAID_INSTALLMENT_BLOCKED",
        "Não é possível reorganizar esta compra porque já existe parcela paga ou parcialmente paga. Para preservar o histórico financeiro, ajuste apenas parcelas sem baixa registrada ou crie um lançamento complementar.",
        409
      );
    }

    assertExpenseInstallmentsMatchTotal(parentExpense.amount, input.installments);

    const currentInstallmentIds = new Set(parentExpense.installments.map((installment) => installment.id));
    const requestedExistingIds = new Set(input.installments.map((installment) => installment.id).filter(Boolean));

    for (const installment of input.installments) {
      if (installment.id && !currentInstallmentIds.has(installment.id)) {
        throw new AppError(
          "EXPENSE_REORGANIZE_INVALID_INSTALLMENT",
          "Uma das parcelas informadas não pertence à compra selecionada.",
          422
        );
      }
    }

    for (const installmentId of currentInstallmentIds) {
      if (!requestedExistingIds.has(installmentId)) {
        await transaction.expense.update({
          where: {
            id: installmentId
          },
          data: {
            status: "CANCELLED"
          }
        });
      }
    }

    for (const [index, installment] of input.installments.entries()) {
      const installmentNumber = installment.installmentNumber ?? index + 1;
      const installmentData = {
        amount: installment.amount,
        cashAccountId: parentExpense.cashAccountId,
        categoryId: parentExpense.categoryId,
        classification: parentExpense.classification,
        clientId: parentExpense.clientId,
        costCenter: parentExpense.costCenter,
        description: installment.description ?? `${parentExpense.description} - parcela ${installmentNumber}/${input.installments.length}`,
        dueDate: installment.dueDate,
        installmentCount: input.installments.length,
        installmentNumber,
        notes: installment.notes ?? parentExpense.notes,
        paidAmount: 0,
        paymentMethod: installment.paymentMethod ?? parentExpense.paymentMethod,
        projectId: parentExpense.projectId,
        purchaseDate: parentExpense.purchaseDate ?? new Date(),
        recurring: false,
        status: "PENDING",
        supplier: parentExpense.supplier
      };

      if (installment.id) {
        await transaction.expense.update({
          where: {
            id: installment.id
          },
          data: installmentData
        });
        continue;
      }

      await transaction.expense.create({
        data: {
          ...installmentData,
          entryType: "INSTALLMENT",
          parentExpenseId: parentExpense.id
        }
      });
    }

    await refreshParentExpenseFromInstallments(transaction, parentExpense.id);

    const expense = await transaction.expense.findUniqueOrThrow({
      where: {
        id: parentExpense.id
      },
      select: expenseSelect
    });

    return mapExpense(expense);
  });
}

export async function listCashMovements(query: ListCashMovementsQuery) {
  const { page, pageSize } = query;
  const where = buildCashMovementWhere(query);

  const [movements, total] = await prisma.$transaction([
    prisma.cashMovement.findMany({
      where,
      select: cashMovementSelect,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.cashMovement.count({ where })
  ]);

  return {
    data: movements.map(mapCashMovement),
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function createManualCashMovement(input: ManualCashMovementInput) {
  assertPositiveAmount(input.amount);

  return prisma.$transaction(async (transaction) => {
    const date = resolveActualDate(input.date, new Date(), "Data da movimentação não pode ser futura.");
    const movement = await transaction.cashMovement.create({
      data: {
        amount: input.amount,
        cashAccountId: input.cashAccountId ?? defaultCashAccountId,
        categoryId: input.categoryId ?? (input.type === "INCOME" ? manualRevenueCategoryId : defaultExpenseCategoryId),
        clientId: input.clientId,
        date,
        description: input.description,
        notes: input.notes,
        origin: input.type === "INCOME" ? "MANUAL_ENTRY" : "MANUAL_EXIT",
        paymentMethod: input.paymentMethod,
        projectId: input.projectId,
        type: input.type
      },
      select: cashMovementSelect
    });

    return {
      movement: mapCashMovement(movement),
      cashSummary: await getCashSummary({}, transaction)
    };
  });
}

export async function getCashSummary(query: CashPeriodQuery = {}, client: PrismaClientLike = prisma) {
  const where = buildCashMovementWhereFromPeriod(query);
  const [movements, cashAccounts] = await Promise.all([
    client.cashMovement.findMany({
      where,
      select: {
        amount: true,
        type: true
      }
    }),
    client.cashAccount.findMany({
      select: {
        openingBalance: true
      }
    })
  ]);
  const openingBalance = cashAccounts.reduce((total, account) => total + toNumber(account.openingBalance), 0);
  const incomeAmount = movements
    .filter((movement) => movement.type === "INCOME")
    .reduce((total, movement) => total + toNumber(movement.amount), 0);
  const expenseAmount = movements
    .filter((movement) => movement.type === "EXPENSE")
    .reduce((total, movement) => total + toNumber(movement.amount), 0);

  return {
    openingBalance: toMoneyString(openingBalance),
    incomeAmount: toMoneyString(incomeAmount),
    expenseAmount: toMoneyString(expenseAmount),
    balance: toMoneyString(openingBalance + incomeAmount - expenseAmount)
  };
}

export async function getCashFlow(query: CashPeriodQuery) {
  const period = resolveCashPeriod(query, new Date());
  const [payments, expenses, movements] = await prisma.$transaction([
    prisma.payment.findMany({
      where: {
        ...buildPaymentScopeWhere(query),
        dueDate: {
          gte: period.from,
          lte: period.to
        },
        status: {
          notIn: ["PAID", "CANCELLED"]
        }
      },
      select: {
        amount: true,
        paidAmount: true,
        dueDate: true,
        status: true
      }
    }),
    prisma.expense.findMany({
      where: {
        ...buildExpenseScopeWhere(query),
        entryType: {
          not: "PURCHASE"
        },
        dueDate: {
          gte: period.from,
          lte: period.to
        },
        status: {
          notIn: ["PAID", "CANCELLED"]
        }
      },
      select: {
        amount: true,
        dueDate: true,
        entryType: true,
        paidAmount: true,
        status: true
      }
    }),
    prisma.cashMovement.findMany({
      where: {
        ...buildCashMovementWhereFromPeriod(query),
        date: {
          gte: period.from,
          lte: period.to
        }
      },
      select: {
        amount: true,
        date: true,
        type: true
      }
    })
  ]);
  const today = new Date();
  const expectedIncome = payments.reduce((total, payment) => {
    const remainingAmount = Math.max(toNumber(payment.amount) - toNumber(payment.paidAmount), 0);

    return total + remainingAmount;
  }, 0);
  const expectedExpense = expenses.reduce((total, expense) => total + getExpenseRemainingAmount(expense), 0);
  const realizedIncome = movements
    .filter((movement) => movement.type === "INCOME")
    .reduce((total, movement) => total + toNumber(movement.amount), 0);
  const realizedExpense = movements
    .filter((movement) => movement.type === "EXPENSE")
    .reduce((total, movement) => total + toNumber(movement.amount), 0);
  const overdueReceivables = payments.filter((payment) => getEffectivePaymentStatus(payment, today) === "OVERDUE");
  const overdueExpenses = expenses.filter((expense) => getEffectiveExpenseStatus(expense, today) === "OVERDUE");

  return {
    period: {
      from: period.from.toISOString(),
      to: period.to.toISOString()
    },
    expectedIncome: toMoneyString(expectedIncome),
    expectedExpense: toMoneyString(expectedExpense),
    expectedBalance: toMoneyString(expectedIncome - expectedExpense),
    realizedIncome: toMoneyString(realizedIncome),
    realizedExpense: toMoneyString(realizedExpense),
    realizedBalance: toMoneyString(realizedIncome - realizedExpense),
    difference: toMoneyString(realizedIncome - realizedExpense - (expectedIncome - expectedExpense)),
    overdueReceivablesAmount: toMoneyString(
      overdueReceivables.reduce((total, payment) => total + Math.max(toNumber(payment.amount) - toNumber(payment.paidAmount), 0), 0)
    ),
    overdueReceivablesCount: overdueReceivables.length,
    overdueExpensesAmount: toMoneyString(overdueExpenses.reduce((total, expense) => total + getExpenseRemainingAmount(expense), 0)),
    overdueExpensesCount: overdueExpenses.length
  };
}

export async function createPayment(input: CreatePaymentInput) {
  assertPositiveAmount(input.amount);

  return prisma.$transaction(async (transaction) => {
    const project = await getProjectForPayment(input.projectId, transaction);

    const payment = await transaction.payment.create({
      data: {
        projectId: project.id,
        clientId: project.clientId,
        categoryId: projectRevenueCategoryId,
        cashAccountId: defaultCashAccountId,
        source: "PROJECT",
        description: input.description,
        amount: input.amount,
        installment: input.installment,
        dueDate: input.dueDate,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        status: "RECEIVABLE"
      },
      select: paymentSelect
    });

    const projectFinancial = await getProjectFinancialOverview(project.id, transaction);
    assertPaymentScheduleMatchesContract(projectFinancial);

    return {
      payment: mapPayment(payment),
      projectFinancial,
      alert: buildProjectFinancialAlert(projectFinancial)
    };
  });
}

export async function updatePayment(id: string, input: UpdatePaymentInput) {
  return prisma.$transaction(async (transaction) => {
    const currentPayment = await transaction.payment.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        visitId: true,
        source: true,
        status: true
      }
    });

    if (!currentPayment) {
      throw new AppError("PAYMENT_NOT_FOUND", "Parcela não encontrada.", 404);
    }

    if (currentPayment.visitId || currentPayment.source === "VISIT") {
      throw new AppError(
        "VISIT_PAYMENT_UPDATE_BLOCKED",
        "Lançamento gerado por visita técnica deve ser editado na própria visita.",
        409
      );
    }

    if (currentPayment.status === "CANCELLED") {
      throw new AppError("PAYMENT_CANCELLED_UPDATE_BLOCKED", "Parcela cancelada não pode ser editada.", 409);
    }

    const payment = await transaction.payment.update({
      where: { id },
      data: input,
      select: paymentSelect
    });

    if (toNumber(payment.paidAmount) > 0 && payment.paidAt) {
      await upsertReceivableCashMovement(transaction, payment);
    }

    const projectFinancial = await getProjectFinancialOverview(currentPayment.projectId, transaction);

    return {
      payment: mapPayment(payment),
      projectFinancial,
      alert: buildProjectFinancialAlert(projectFinancial)
    };
  });
}

export async function registerPayment(id: string, input: RegisterPaymentInput) {
  return prisma.$transaction(async (transaction) => {
    const currentPayment = await transaction.payment.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        amount: true,
        status: true
      }
    });

    if (!currentPayment) {
      throw new AppError("PAYMENT_NOT_FOUND", "Parcela não encontrada.", 404);
    }

    if (currentPayment.status === "CANCELLED") {
      throw new AppError("PAYMENT_CANCELLED_REGISTER_BLOCKED", "Parcela cancelada não pode receber pagamento.", 409);
    }

    const paidData = resolveRegisteredPaymentData(
      {
        amount: toNumber(currentPayment.amount),
        paidAmount: input.paidAmount,
        paidAt: input.paidAt
      },
      new Date()
    );

    const payment = await transaction.payment.update({
      where: { id },
      data: paidData,
      select: paymentSelect
    });

    await upsertReceivableCashMovement(transaction, payment);

    const projectFinancial = await getProjectFinancialOverview(currentPayment.projectId, transaction);

    return {
      payment: mapPayment(payment),
      projectFinancial,
      alert: buildProjectFinancialAlert(projectFinancial)
    };
  });
}

export async function cancelPayment(id: string) {
  return prisma.$transaction(async (transaction) => {
    const payment = await transaction.payment.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        visitId: true,
        source: true,
        status: true
      }
    });

    if (!payment) {
      throw new AppError("PAYMENT_NOT_FOUND", "Parcela não encontrada.", 404);
    }

    if (payment.visitId || payment.source === "VISIT") {
      throw new AppError(
        "VISIT_PAYMENT_CANCEL_BLOCKED",
        "Lançamento gerado por visita técnica deve ser cancelado pela própria visita.",
        409
      );
    }

    if (payment.status === "PAID") {
      throw new AppError("PAYMENT_PAID_CANCEL_BLOCKED", "Parcela paga não pode ser cancelada.", 409);
    }

    const updatedPayment = await transaction.payment.update({
      where: { id },
      data: {
        status: "CANCELLED"
      },
      select: paymentSelect
    });

    const projectFinancial = await getProjectFinancialOverview(payment.projectId, transaction);
    assertPaymentScheduleMatchesContract(projectFinancial);

    return mapPayment(updatedPayment);
  });
}

export function assertChargedVisitHasProject(visit: Pick<VisitPaymentSnapshot, "amount" | "projectId">) {
  if (toNumber(visit.amount) > 0 && !visit.projectId) {
    throw new AppError(
      "VISIT_PAYMENT_PROJECT_REQUIRED",
      "Visita técnica com valor deve estar vinculada a um projeto para gerar lançamento financeiro.",
      422
    );
  }
}

export async function syncVisitPaymentFromVisit(client: PrismaClientLike, visit: VisitPaymentSnapshot) {
  const amount = toNumber(visit.amount);
  assertChargedVisitHasProject(visit);

  const currentPayment = await client.payment.findUnique({
    where: { visitId: visit.id },
    select: {
      amount: true,
      clientId: true,
      dueDate: true,
      id: true,
      paidAmount: true,
      projectId: true,
      status: true
    }
  });

  if (amount <= 0 || visit.status === "CANCELLED") {
    if (!currentPayment) {
      return null;
    }

    assertVisitPaymentCanBeChanged(currentPayment, visit);

    return client.payment.update({
      where: { id: currentPayment.id },
      data: { status: "CANCELLED" },
      select: paymentSelect
    });
  }

  if (!visit.projectId) {
    throw new AppError(
      "VISIT_PAYMENT_PROJECT_REQUIRED",
      "Visita técnica com valor deve estar vinculada a um projeto para gerar lançamento financeiro.",
      422
    );
  }

  if (!currentPayment) {
    return client.payment.create({
      data: {
        amount,
        clientId: visit.clientId,
        categoryId: visitRevenueCategoryId,
        cashAccountId: defaultCashAccountId,
        description: buildVisitPaymentDescription(visit),
        dueDate: visit.date,
        projectId: visit.projectId,
        source: "VISIT",
        status: "RECEIVABLE",
        visitId: visit.id
      },
      select: paymentSelect
    });
  }

  assertVisitPaymentCanBeChanged(currentPayment, visit);

  return client.payment.update({
    where: { id: currentPayment.id },
    data: {
      amount,
      clientId: visit.clientId,
      categoryId: visitRevenueCategoryId,
      cashAccountId: currentPayment.status === "CANCELLED" ? defaultCashAccountId : undefined,
      description: buildVisitPaymentDescription(visit),
      dueDate: visit.date,
      projectId: visit.projectId,
      source: "VISIT",
      status: currentPayment.status === "CANCELLED" ? "RECEIVABLE" : currentPayment.status
    },
    select: paymentSelect
  });
}

export async function assertVisitCanBeDeletedFromFinancial(client: PrismaClientLike, visitId: string) {
  const payment = await client.payment.findUnique({
    where: { visitId },
    select: { id: true }
  });

  if (payment) {
    throw new AppError(
      "VISIT_PAYMENT_DELETE_BLOCKED",
      "Visita técnica com lançamento financeiro não pode ser excluída. Cancele a visita para preservar o histórico financeiro.",
      409
    );
  }
}

export async function generateProjectInstallments(input: GenerateInstallmentsInput) {
  return prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findUnique({
      where: { id: input.projectId },
      select: {
        id: true,
        clientId: true,
        name: true,
        contractedAmount: true,
        payments: {
          where: {
            source: "PROJECT",
            status: {
              not: "CANCELLED"
            }
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!project) {
      throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
    }

    const contractedAmount = toNumber(project.contractedAmount);

    if (contractedAmount <= 0) {
      throw new AppError("PROJECT_CONTRACTED_AMOUNT_REQUIRED", "Projeto precisa ter valor contratado para gerar parcelas.", 422);
    }

    if (project.payments.length > 0) {
      throw new AppError("PROJECT_PAYMENTS_ALREADY_EXISTS", "Projeto já possui parcelas ativas.", 409);
    }

    const amounts = splitAmountIntoInstallments(contractedAmount, input.installments);
    const payments: PaymentRecord[] = [];

    for (const [index, amount] of amounts.entries()) {
      const payment = await transaction.payment.create({
        data: {
          projectId: project.id,
          clientId: project.clientId,
          categoryId: projectRevenueCategoryId,
          cashAccountId: defaultCashAccountId,
          source: "PROJECT",
          description: input.description ?? `${project.name} - parcela ${index + 1}/${input.installments}`,
          amount,
          installment: index + 1,
          dueDate: addMonths(input.firstDueDate, index),
          paymentMethod: input.paymentMethod,
          notes: input.notes,
          status: "RECEIVABLE"
        },
        select: paymentSelect
      });

      payments.push(payment);
    }

    const projectFinancial = await getProjectFinancialOverview(project.id, transaction);
    assertPaymentScheduleMatchesContract(projectFinancial);

    return {
      payments: payments.map(mapPayment),
      projectFinancial,
      alert: buildProjectFinancialAlert(projectFinancial)
    };
  });
}

export async function reorganizeProjectInstallments(projectId: string, input: ReorganizeInstallmentsInput) {
  return prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        clientId: true,
        contractedAmount: true,
        payments: {
          where: {
            source: "PROJECT",
            status: {
              not: "CANCELLED"
            }
          },
          select: {
            id: true,
            description: true,
            amount: true,
            paidAmount: true,
            installment: true,
            dueDate: true,
            paidAt: true,
            paymentMethod: true,
            status: true,
            notes: true
          }
        }
      }
    });

    if (!project) {
      throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
    }

    const contractedAmount = toNumber(project.contractedAmount);

    if (contractedAmount <= 0) {
      throw new AppError("PROJECT_CONTRACTED_AMOUNT_REQUIRED", "Projeto precisa ter valor contratado para reorganizar parcelas.", 422);
    }

    assertInstallmentPlanMatchesContract(contractedAmount, input.installments);

    const currentPaymentsById = new Map(project.payments.map((payment) => [payment.id, payment]));
    const requestedExistingIds = new Set(input.installments.map((installment) => installment.id).filter(Boolean));

    for (const installment of input.installments) {
      if (installment.id && !currentPaymentsById.has(installment.id)) {
        throw new AppError(
          "PAYMENT_REORGANIZE_INVALID_INSTALLMENT",
          "Uma das parcelas informadas não pertence ao projeto ou não está ativa.",
          422
        );
      }
    }

    for (const payment of project.payments) {
      if (isPaymentFullyPaid(payment)) {
        const installment = input.installments.find((item) => item.id === payment.id);

        if (!installment) {
          throw new AppError(
            "PAYMENT_PAID_REORGANIZE_BLOCKED",
            "Parcela paga não pode ser removida do plano financeiro.",
            409
          );
        }

        assertFullyPaidInstallmentUnchanged(payment, installment);
        continue;
      }

      if (isPaymentPartiallyPaid(payment) && !requestedExistingIds.has(payment.id)) {
        throw new AppError(
          "PAYMENT_PARTIALLY_PAID_REORGANIZE_BLOCKED",
          "Parcela parcialmente paga não pode ser removida. Ajuste o valor preservando o que já foi recebido.",
          409
        );
      }
    }

    for (const installment of input.installments) {
      if (!installment.id) {
        continue;
      }

      const currentPayment = currentPaymentsById.get(installment.id);

      if (currentPayment && isPaymentPartiallyPaid(currentPayment)) {
        assertPartiallyPaidInstallmentCanBeReorganized(currentPayment, installment);
      }
    }

    for (const payment of project.payments) {
      if (requestedExistingIds.has(payment.id) || isPaymentFullyPaid(payment) || isPaymentPartiallyPaid(payment)) {
        continue;
      }

      await transaction.payment.update({
        where: { id: payment.id },
        data: {
          status: "CANCELLED"
        }
      });
    }

    for (const [index, installment] of input.installments.entries()) {
      const installmentNumber = installment.installment ?? index + 1;

      if (!installment.id) {
        await transaction.payment.create({
          data: {
            projectId: project.id,
            clientId: project.clientId,
            categoryId: projectRevenueCategoryId,
            cashAccountId: defaultCashAccountId,
            source: "PROJECT",
            description: installment.description,
            amount: installment.amount,
            installment: installmentNumber,
            dueDate: installment.dueDate,
            paymentMethod: installment.paymentMethod,
            notes: installment.notes,
            status: "RECEIVABLE"
          }
        });

        continue;
      }

      const currentPayment = currentPaymentsById.get(installment.id);

      if (!currentPayment || isPaymentFullyPaid(currentPayment)) {
        continue;
      }

      const paidAmount = toNumber(currentPayment.paidAmount);
      const status = paidAmount > 0 ? resolvePartiallyPaidReorganizedStatus(installment.amount, paidAmount) : "RECEIVABLE";

      await transaction.payment.update({
        where: { id: installment.id },
        data: {
          description: installment.description,
          amount: installment.amount,
          installment: installmentNumber,
          dueDate: installment.dueDate,
          paymentMethod: installment.paymentMethod,
          notes: installment.notes,
          status
        }
      });
    }

    const projectFinancial = await getProjectFinancialOverview(project.id, transaction);
    assertPaymentScheduleMatchesContract(projectFinancial);

    const payments = await transaction.payment.findMany({
      where: {
        projectId: project.id,
        source: "PROJECT",
        status: {
          not: "CANCELLED"
        }
      },
      orderBy: [{ installment: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
      select: paymentSelect
    });

    return {
      payments: payments.map(mapPayment),
      projectFinancial,
      alert: buildProjectFinancialAlert(projectFinancial)
    };
  });
}

export function buildPaymentWhere(
  { clientId, dueFrom, dueTo, projectId, search, status }: Partial<ListPaymentsQuery>,
  today = new Date()
): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};

  if (clientId) {
    where.clientId = clientId;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  if (status === "OVERDUE") {
    where.status = { notIn: ["PAID", "CANCELLED"] };
    where.dueDate = {
      ...(where.dueDate && typeof where.dueDate === "object" ? where.dueDate : {}),
      lt: startOfDay(today)
    };
  } else if (status) {
    where.status = status;
  }

  if (dueFrom || dueTo) {
    where.dueDate = {
      ...(where.dueDate && typeof where.dueDate === "object" ? where.dueDate : {}),
      ...(dueFrom ? { gte: startOfDay(dueFrom) } : {}),
      ...(dueTo ? { lte: endOfDay(dueTo) } : {})
    };
  }

  if (search) {
    where.OR = [
      { description: { contains: search } },
      { client: { name: { contains: search } } },
      { project: { name: { contains: search } } }
    ];
  }

  return where;
}

export function buildExpenseWhere(
  { cashAccountId, categoryId, classification, clientId, dueFrom, dueTo, projectId, search, status }: Partial<ListExpensesQuery>,
  today = new Date()
): Prisma.ExpenseWhereInput {
  const filters: Prisma.ExpenseWhereInput[] = [{ parentExpenseId: null }];

  if (clientId) {
    filters.push({ clientId });
  }

  if (projectId) {
    filters.push({ projectId });
  }

  if (categoryId) {
    filters.push({ categoryId });
  }

  if (cashAccountId) {
    filters.push({ cashAccountId });
  }

  if (classification) {
    filters.push({ classification });
  }

  const installmentFilter: Prisma.ExpenseWhereInput = {};

  if (status === "OVERDUE") {
    installmentFilter.status = { notIn: ["PAID", "CANCELLED"] };
    installmentFilter.dueDate = {
      lt: startOfDay(today)
    };
  } else if (status) {
    installmentFilter.status = status;
  }

  if (dueFrom || dueTo) {
    installmentFilter.dueDate = {
      ...(installmentFilter.dueDate && typeof installmentFilter.dueDate === "object" ? installmentFilter.dueDate : {}),
      ...(dueFrom ? { gte: startOfDay(dueFrom) } : {}),
      ...(dueTo ? { lte: endOfDay(dueTo) } : {})
    };
  }

  if (status || dueFrom || dueTo) {
    filters.push({
      OR: [
        {
          entryType: {
            not: "PURCHASE"
          },
          ...installmentFilter
        },
        {
          entryType: "PURCHASE",
          installments: {
            some: installmentFilter
          }
        }
      ]
    });
  }

  if (search) {
    filters.push({
      OR: [
        { description: { contains: search } },
        { supplier: { contains: search } },
        { project: { name: { contains: search } } },
        { client: { name: { contains: search } } }
      ]
    });
  }

  return {
    AND: filters
  };
}

export function buildCashMovementWhere(
  { cashAccountId, categoryId, clientId, dateFrom, dateTo, origin, projectId, search, type }: Partial<ListCashMovementsQuery>
): Prisma.CashMovementWhereInput {
  return {
    ...buildCashMovementWhereFromPeriod({
      cashAccountId,
      categoryId,
      clientId,
      from: dateFrom,
      projectId,
      to: dateTo
    }),
    ...(origin ? { origin } : {}),
    ...(type ? { type } : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search } },
            { client: { name: { contains: search } } },
            { project: { name: { contains: search } } }
          ]
        }
      : {})
  };
}

export function getEffectivePaymentStatus(payment: { dueDate: Date; status: string }, today = new Date()): PaymentStatus {
  if (isPaymentOverdue(payment, today)) {
    return "OVERDUE";
  }

  if (payment.status === "OVERDUE") {
    return "RECEIVABLE";
  }

  return payment.status as PaymentStatus;
}

export function getEffectiveExpenseStatus(
  expense: {
    amount?: { toString(): string } | number | string;
    dueDate: Date | null;
    entryType?: string;
    installments?: Array<{
      amount?: { toString(): string } | number | string;
      dueDate: Date | null;
      paidAmount?: { toString(): string } | number | string;
      status: string;
    }>;
    paidAmount?: { toString(): string } | number | string;
    status: string;
  },
  today = new Date()
): ExpenseStatus {
  if (expense.entryType === "PURCHASE" && expense.installments) {
    return getPurchaseStatusFromInstallments(expense.installments, today);
  }

  if (expense.status === "PENDING" && expense.dueDate && startOfDay(expense.dueDate) < startOfDay(today)) {
    return "OVERDUE";
  }

  if (expense.status === "PARTIALLY_PAID" && expense.dueDate && startOfDay(expense.dueDate) < startOfDay(today) && getExpenseRemainingAmount(expense) > 0) {
    return "OVERDUE";
  }

  if (expense.status === "OVERDUE") {
    return "PENDING";
  }

  return expense.status as ExpenseStatus;
}

function getPurchaseStatusFromInstallments(
  installments: Array<{
    amount?: { toString(): string } | number | string;
    dueDate: Date | null;
    paidAmount?: { toString(): string } | number | string;
    status: string;
  }>,
  today = new Date()
): ExpenseStatus {
  const activeInstallments = installments.filter((installment) => installment.status !== "CANCELLED");

  if (activeInstallments.length === 0) {
    return installments.length > 0 ? "CANCELLED" : "PENDING";
  }

  if (activeInstallments.every((installment) => installment.status === "PAID")) {
    return "PAID";
  }

  if (activeInstallments.some((installment) => getEffectiveExpenseStatus(installment, today) === "OVERDUE")) {
    return "OVERDUE";
  }

  if (activeInstallments.some((installment) => installment.status === "PARTIALLY_PAID" || toNumber(installment.paidAmount) > 0)) {
    return "PARTIALLY_PAID";
  }

  return "PENDING";
}

function isExpensePayableLeaf(expense: { entryType?: string; status: string }) {
  return expense.entryType !== "PURCHASE" && expense.status !== "CANCELLED";
}

function getExpenseRemainingAmount(expense: {
  amount?: { toString(): string } | number | string;
  paidAmount?: { toString(): string } | number | string;
  status?: string;
}) {
  if (expense.status === "CANCELLED") {
    return 0;
  }

  return roundMoney(Math.max(toNumber(expense.amount) - toNumber(expense.paidAmount), 0));
}

function getComparableExpenseDueDate(expense: { dueDate: Date | null; installments?: Array<{ dueDate: Date | null; status: string }> }) {
  if (expense.dueDate) {
    return expense.dueDate;
  }

  const dueDates = expense.installments
    ?.filter((installment) => installment.status !== "CANCELLED" && installment.dueDate)
    .map((installment) => installment.dueDate as Date)
    .sort((first, second) => Number(first) - Number(second));

  return dueDates?.[0] ?? null;
}

export function comparePaymentsForFinancialList(first: PaymentListSortSnapshot, second: PaymentListSortSnapshot, today = new Date()) {
  const firstStatusOrder = getFinancialListStatusOrder(getEffectivePaymentStatus(first, today));
  const secondStatusOrder = getFinancialListStatusOrder(getEffectivePaymentStatus(second, today));

  if (firstStatusOrder !== secondStatusOrder) {
    return firstStatusOrder - secondStatusOrder;
  }

  const dueDateDifference = first.dueDate.getTime() - second.dueDate.getTime();

  if (dueDateDifference !== 0) {
    return dueDateDifference;
  }

  return second.createdAt.getTime() - first.createdAt.getTime();
}

function getFinancialListStatusOrder(status: PaymentStatus) {
  const order: Record<PaymentStatus, number> = {
    OVERDUE: 0,
    RECEIVABLE: 1,
    PARTIALLY_PAID: 2,
    PAID: 3,
    CANCELLED: 4
  };

  return order[status] ?? 5;
}

function compareExpensesForFinancialList(
  first: { createdAt: Date; dueDate: Date | null; status: string; installments?: Array<{ dueDate: Date | null; status: string }> },
  second: { createdAt: Date; dueDate: Date | null; status: string; installments?: Array<{ dueDate: Date | null; status: string }> },
  today = new Date()
) {
  const firstStatusOrder = getExpenseListStatusOrder(getEffectiveExpenseStatus(first, today));
  const secondStatusOrder = getExpenseListStatusOrder(getEffectiveExpenseStatus(second, today));

  if (firstStatusOrder !== secondStatusOrder) {
    return firstStatusOrder - secondStatusOrder;
  }

  const firstDueDate = getComparableExpenseDueDate(first);
  const secondDueDate = getComparableExpenseDueDate(second);
  const dueDateDifference = Number(firstDueDate ?? first.createdAt) - Number(secondDueDate ?? second.createdAt);

  if (dueDateDifference !== 0) {
    return dueDateDifference;
  }

  return second.createdAt.getTime() - first.createdAt.getTime();
}

function getExpenseListStatusOrder(status: ExpenseStatus) {
  const order: Record<ExpenseStatus, number> = {
    OVERDUE: 0,
    PENDING: 1,
    PARTIALLY_PAID: 2,
    PAID: 3,
    CANCELLED: 4
  };

  return order[status] ?? 5;
}

export function splitAmountIntoInstallments(totalAmount: number, installments: number) {
  assertPositiveAmount(totalAmount, "valor contratado");

  if (!Number.isInteger(installments) || installments < 1 || installments > maxInstallmentCount) {
    throw new AppError(
      "INVALID_INSTALLMENT_COUNT",
      `parcelamento deve ser de 1 a ${maxInstallmentCount} parcelas.`,
      422
    );
  }

  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / installments);
  const remainder = totalCents % installments;

  return Array.from({ length: installments }, (_value, index) => (baseCents + (index < remainder ? 1 : 0)) / 100);
}

export function resolveRegisteredPaymentData(
  input: { amount: number; paidAmount?: number; paidAt?: Date },
  today = new Date()
) {
  const paidAmount = input.paidAmount ?? input.amount;

  assertPositiveAmount(paidAmount, "valor pago");

  if (paidAmount > input.amount) {
    throw new AppError("PAYMENT_PAID_AMOUNT_TOO_HIGH", "Valor pago não pode ser maior que o valor da parcela.", 422);
  }

  const paidAt = input.paidAt ?? today;

  if (startOfDay(paidAt) > startOfDay(today)) {
    throw new AppError("PAYMENT_DATE_IN_FUTURE", "Data de pagamento não pode ser futura.", 422);
  }

  return {
    paidAmount,
    paidAt,
    status: paidAmount >= input.amount ? "PAID" : "PARTIALLY_PAID"
  };
}

export function buildProjectFinancialSummary(project: ProjectFinancialSnapshot, today = new Date()) {
  const contractedAmount = toNumber(project.contractedAmount);
  let scheduledAmount = 0;
  let receivedAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;

  for (const payment of project.payments) {
    if (payment.status === "CANCELLED") {
      continue;
    }

    const amount = toNumber(payment.amount);
    const paidAmount = toNumber(payment.paidAmount);
    const remainingAmount = roundMoney(Math.max(amount - paidAmount, 0));
    const effectiveStatus = getEffectivePaymentStatus(payment, today);

    if (payment.source !== "VISIT") {
      scheduledAmount += amount;
    }

    receivedAmount += paidAmount;

    if (payment.status !== "PAID") {
      pendingAmount += remainingAmount;
    }

    if (effectiveStatus === "OVERDUE") {
      overdueAmount += remainingAmount;
    }
  }

  const scheduleDifferenceAmount = getPaymentScheduleDifference(contractedAmount, scheduledAmount);
  const overContractedAmount = Math.max(scheduleDifferenceAmount, 0);
  const underContractedAmount = Math.max(roundMoney(-scheduleDifferenceAmount), 0);
  const contractDifferenceAmount = roundMoney(Math.abs(scheduleDifferenceAmount));

  return {
    contractedAmount: roundMoney(contractedAmount),
    scheduledAmount: roundMoney(scheduledAmount),
    receivedAmount: roundMoney(receivedAmount),
    pendingAmount: roundMoney(pendingAmount),
    overdueAmount: roundMoney(overdueAmount),
    contractDifferenceAmount,
    overContractedAmount,
    underContractedAmount,
    hasContractMismatchAlert: contractedAmount > 0 && scheduledAmount > 0 && contractDifferenceAmount > 0,
    hasOverContractedAlert: contractedAmount > 0 && overContractedAmount > 0
  };
}

export function getPaymentScheduleDifference(
  contractedAmount: { toString(): string } | number | string | null | undefined,
  scheduledAmount: { toString(): string } | number | string | null | undefined
) {
  return roundMoney(toNumber(scheduledAmount) - toNumber(contractedAmount));
}

export function assertPaymentScheduleMatchesContract({
  contractedAmount,
  scheduledAmount
}: {
  contractedAmount: { toString(): string } | number | string | null | undefined;
  scheduledAmount: { toString(): string } | number | string | null | undefined;
}) {
  const contracted = roundMoney(toNumber(contractedAmount));
  const scheduled = roundMoney(toNumber(scheduledAmount));

  if (contracted <= 0 && scheduled > 0) {
    throw new AppError("PROJECT_CONTRACTED_AMOUNT_REQUIRED", "Projeto precisa ter valor contratado para registrar parcelas.", 422);
  }

  if (contracted > 0 && getPaymentScheduleDifference(contracted, scheduled) !== 0) {
    throw new AppError(
      "PROJECT_PAYMENTS_TOTAL_MISMATCH",
      "A soma das parcelas ativas deve ser igual ao valor contratado do projeto.",
      422,
      {
        contractedAmount: toMoneyString(contracted),
        scheduledAmount: toMoneyString(scheduled)
      }
    );
  }
}

export function assertInstallmentPlanMatchesContract(
  contractedAmount: { toString(): string } | number | string | null | undefined,
  installments: Array<{ amount: { toString(): string } | number | string }>
) {
  const scheduledAmount = installments.reduce((total, installment) => total + toNumber(installment.amount), 0);

  assertPaymentScheduleMatchesContract({
    contractedAmount,
    scheduledAmount
  });
}

export function resolvePartiallyPaidReorganizedStatus(amount: number, paidAmount: number): PaymentStatus {
  const normalizedAmount = roundMoney(amount);
  const normalizedPaidAmount = roundMoney(paidAmount);

  if (normalizedAmount < normalizedPaidAmount) {
    throw new AppError(
      "PAYMENT_REORGANIZE_AMOUNT_BELOW_PAID",
      "Valor da parcela não pode ser menor que o valor já recebido.",
      422
    );
  }

  return normalizedAmount === normalizedPaidAmount ? "PAID" : "PARTIALLY_PAID";
}

function isPaymentFullyPaid(payment: { amount: { toString(): string } | number | string; paidAmount: { toString(): string } | number | string; status: string }) {
  const amount = roundMoney(toNumber(payment.amount));
  const paidAmount = roundMoney(toNumber(payment.paidAmount));

  return payment.status === "PAID" || (paidAmount > 0 && paidAmount >= amount);
}

function isPaymentPartiallyPaid(payment: {
  amount: { toString(): string } | number | string;
  paidAmount: { toString(): string } | number | string;
  status: string;
}) {
  return !isPaymentFullyPaid(payment) && (payment.status === "PARTIALLY_PAID" || toNumber(payment.paidAmount) > 0);
}

function assertFullyPaidInstallmentUnchanged(
  payment: {
    amount: { toString(): string } | number | string;
    description: string;
    dueDate: Date;
    installment: number | null;
    paymentMethod: string | null;
    notes: string | null;
  },
  installment: ReorganizedInstallmentSnapshot
) {
  const hasChanged =
    payment.description !== installment.description ||
    roundMoney(toNumber(payment.amount)) !== roundMoney(installment.amount) ||
    payment.installment !== (installment.installment ?? null) ||
    toDateKey(payment.dueDate) !== toDateKey(installment.dueDate) ||
    normalizeNullableText(payment.paymentMethod) !== normalizeNullableText(installment.paymentMethod) ||
    normalizeNullableText(payment.notes) !== normalizeNullableText(installment.notes);

  if (hasChanged) {
    throw new AppError(
      "PAYMENT_PAID_REORGANIZE_BLOCKED",
      "Parcela paga não pode ter valor, vencimento ou dados alterados na reorganização.",
      409
    );
  }
}

function assertPartiallyPaidInstallmentCanBeReorganized(
  payment: {
    paidAmount: { toString(): string } | number | string;
  },
  installment: ReorganizedInstallmentSnapshot
) {
  const paidAmount = roundMoney(toNumber(payment.paidAmount));
  const nextAmount = roundMoney(installment.amount);

  if (nextAmount < paidAmount) {
    throw new AppError(
      "PAYMENT_REORGANIZE_AMOUNT_BELOW_PAID",
      "Valor da parcela parcialmente paga não pode ser menor que o valor já recebido.",
      422,
      {
        paidAmount: toMoneyString(paidAmount),
        installmentAmount: toMoneyString(nextAmount)
      }
    );
  }
}

function assertVisitPaymentCanBeChanged(
  payment: {
    amount: { toString(): string } | number | string;
    clientId: string;
    dueDate: Date;
    paidAmount: { toString(): string } | number | string;
    projectId: string;
    status: string;
  },
  visit: VisitPaymentSnapshot
) {
  const isSettled = toNumber(payment.paidAmount) > 0 || ["PAID", "PARTIALLY_PAID"].includes(payment.status);

  if (!isSettled) {
    return;
  }

  const hasFinancialChange =
    toNumber(payment.amount) !== toNumber(visit.amount) ||
    payment.clientId !== visit.clientId ||
    payment.projectId !== visit.projectId ||
    startOfDay(payment.dueDate).getTime() !== startOfDay(visit.date).getTime() ||
    visit.status === "CANCELLED";

  if (hasFinancialChange) {
    throw new AppError(
      "VISIT_PAYMENT_SETTLED_CHANGE_BLOCKED",
      "Visita técnica com pagamento registrado não pode alterar valor, data, projeto, cliente ou ser cancelada sem fluxo de estorno.",
      409
    );
  }
}

export function buildVisitPaymentDescription(visit: Pick<VisitPaymentSnapshot, "date" | "type">) {
  const typeLabel = visitTypeLabels[visit.type as keyof typeof visitTypeLabels] ?? "Visita técnica";

  return `${typeLabel} - ${formatDateOnlyPtBr(visit.date)}`;
}

function formatDateOnlyPtBr(date: Date) {
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

async function getProjectForPayment(projectId: string, client: PrismaClientLike) {
  const project = await client.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true
    }
  });

  if (!project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  return project;
}

async function getProjectFinancialOverview(projectId: string, client: PrismaClientLike) {
  const project = await client.project.findUnique({
    where: { id: projectId },
    select: projectFinancialSelect
  });

  if (!project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  return mapProjectFinancial(project);
}

function mapPayment(payment: PaymentRecord) {
  return {
    id: payment.id,
    projectId: payment.projectId,
    clientId: payment.clientId,
    visitId: payment.visitId,
    categoryId: payment.categoryId,
    cashAccountId: payment.cashAccountId,
    source: payment.source,
    description: payment.description,
    amount: payment.amount.toString(),
    paidAmount: payment.paidAmount.toString(),
    installment: payment.installment,
    dueDate: payment.dueDate.toISOString(),
    paidAt: payment.paidAt?.toISOString() ?? null,
    paymentMethod: payment.paymentMethod,
    status: getEffectivePaymentStatus(payment),
    storedStatus: payment.status,
    notes: payment.notes,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    client: payment.client,
    project: {
      ...payment.project,
      contractedAmount: payment.project.contractedAmount?.toString() ?? null
    },
    category: payment.category,
    cashAccount: payment.cashAccount
  };
}

function mapExpense(expense: ExpenseRecord, today = new Date()): any {
  const status = getEffectiveExpenseStatus(expense, today);
  const installments: any[] = expense.installments?.map((installment) => mapExpense(installment as ExpenseRecord, today)) ?? [];
  const paidAmount: number = expense.entryType === "PURCHASE"
    ? installments.reduce((total: number, installment: any) => total + Number(installment.paidAmount), 0)
    : toNumber(expense.paidAmount);
  const pendingAmount: number = expense.entryType === "PURCHASE"
    ? installments.reduce((total: number, installment: any) => total + Number(installment.pendingAmount), 0)
    : getExpenseRemainingAmount(expense);

  return {
    id: expense.id,
    parentExpenseId: expense.parentExpenseId,
    projectId: expense.projectId,
    clientId: expense.clientId,
    categoryId: expense.categoryId,
    cashAccountId: expense.cashAccountId,
    entryType: expense.entryType,
    classification: expense.classification,
    description: expense.description,
    supplier: expense.supplier,
    costCenter: expense.costCenter,
    amount: expense.amount.toString(),
    paidAmount: toMoneyString(paidAmount),
    pendingAmount: toMoneyString(pendingAmount),
    dueDate: expense.dueDate?.toISOString() ?? null,
    purchaseDate: expense.purchaseDate?.toISOString() ?? null,
    paidAt: expense.paidAt?.toISOString() ?? null,
    paymentMethod: expense.paymentMethod,
    status,
    storedStatus: expense.status,
    installmentNumber: expense.installmentNumber,
    installmentCount: expense.entryType === "PURCHASE" ? installments.length : expense.installmentCount,
    recurring: expense.recurring,
    notes: expense.notes,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
    category: expense.category,
    cashAccount: expense.cashAccount,
    client: expense.client,
    project: expense.project,
    payments: expense.payments.map(mapExpensePayment),
    installments
  };
}

function mapExpensePayment(payment: ExpenseRecord["payments"][number]) {
  return {
    id: payment.id,
    amount: payment.amount.toString(),
    paidAt: payment.paidAt.toISOString(),
    paymentMethod: payment.paymentMethod,
    cashAccountId: payment.cashAccountId,
    notes: payment.notes,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    cashAccount: payment.cashAccount,
    cashMovement: payment.cashMovement
      ? {
          id: payment.cashMovement.id,
          date: payment.cashMovement.date.toISOString(),
          amount: payment.cashMovement.amount.toString()
        }
      : null
  };
}

function mapCashMovement(movement: CashMovementRecord) {
  return {
    id: movement.id,
    paymentId: movement.paymentId,
    expenseId: movement.expenseId,
    expensePaymentId: movement.expensePaymentId,
    visitId: movement.visitId,
    clientId: movement.clientId,
    projectId: movement.projectId,
    categoryId: movement.categoryId,
    cashAccountId: movement.cashAccountId,
    type: movement.type,
    date: movement.date.toISOString(),
    description: movement.description,
    amount: movement.amount.toString(),
    paymentMethod: movement.paymentMethod,
    origin: movement.origin,
    referenceId: movement.referenceId,
    notes: movement.notes,
    createdAt: movement.createdAt.toISOString(),
    updatedAt: movement.updatedAt.toISOString(),
    category: movement.category,
    cashAccount: movement.cashAccount,
    client: movement.client,
    project: movement.project
  };
}

function mapFinancialCategory(category: FinancialCategoryRecord) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    costCenter: category.costCenter,
    active: category.active,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  };
}

function mapCashAccount(account: CashAccountRecord) {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    openingBalance: account.openingBalance.toString(),
    active: account.active,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString()
  };
}

function mapProjectFinancial(project: ProjectFinancialRecord) {
  const summary = buildProjectFinancialSummary(project);

  return {
    id: project.id,
    name: project.name,
    contractedAmount: toMoneyString(summary.contractedAmount),
    scheduledAmount: toMoneyString(summary.scheduledAmount),
    receivedAmount: toMoneyString(summary.receivedAmount),
    pendingAmount: toMoneyString(summary.pendingAmount),
    overdueAmount: toMoneyString(summary.overdueAmount),
    contractDifferenceAmount: toMoneyString(summary.contractDifferenceAmount),
    overContractedAmount: toMoneyString(summary.overContractedAmount),
    underContractedAmount: toMoneyString(summary.underContractedAmount),
    hasContractMismatchAlert: summary.hasContractMismatchAlert,
    hasOverContractedAlert: summary.hasOverContractedAlert
  };
}

function buildProjectFinancialAlert(projectFinancial: ReturnType<typeof mapProjectFinancial>) {
  if (!projectFinancial.hasContractMismatchAlert) {
    return null;
  }

  return {
    code: "PROJECT_PAYMENTS_TOTAL_MISMATCH",
    message: "Soma das parcelas ativas deve ser igual ao valor contratado do projeto.",
    amount: projectFinancial.contractDifferenceAmount
  };
}

export function assertExpenseInstallmentsMatchTotal(
  totalAmount: { toString(): string } | number | string,
  installments: Array<{ amount: { toString(): string } | number | string }>
) {
  const totalCents = toCents(totalAmount);
  const installmentsCents = installments.reduce((total, installment) => total + toCents(installment.amount), 0);

  if (installmentsCents !== totalCents) {
    throw new AppError(
      "EXPENSE_INSTALLMENTS_TOTAL_MISMATCH",
      "A soma das parcelas deve ser exatamente igual ao valor total da compra.",
      422,
      {
        totalAmount: toMoneyString(totalCents / 100),
        installmentsAmount: toMoneyString(installmentsCents / 100)
      }
    );
  }
}

async function refreshParentExpenseFromInstallments(client: PrismaClientLike, parentExpenseId: string) {
  const installments = await client.expense.findMany({
    where: {
      parentExpenseId
    },
    select: {
      amount: true,
      dueDate: true,
      paidAmount: true,
      status: true
    }
  });

  const activeInstallments = installments.filter((installment) => installment.status !== "CANCELLED");
  const paidAmount = activeInstallments.reduce((total, installment) => total + toNumber(installment.paidAmount), 0);
  const status = getPurchaseStatusFromInstallments(installments, new Date());
  const paidAt = status === "PAID" ? new Date() : null;

  await client.expense.update({
    where: {
      id: parentExpenseId
    },
    data: {
      paidAmount: roundMoney(paidAmount),
      paidAt,
      status
    }
  });
}

async function resolveExpenseClientId(input: Pick<CreateExpenseInput, "clientId" | "projectId">, client: PrismaClientLike) {
  if (input.projectId) {
    const project = await client.project.findUnique({
      where: { id: input.projectId },
      select: {
        clientId: true
      }
    });

    if (!project) {
      throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
    }

    if (input.clientId && input.clientId !== project.clientId) {
      throw new AppError("EXPENSE_PROJECT_CLIENT_MISMATCH", "O projeto informado não pertence ao cliente da despesa.", 422);
    }

    return project.clientId;
  }

  if (input.clientId) {
    const clientRecord = await client.client.findUnique({
      where: { id: input.clientId },
      select: {
        id: true
      }
    });

    if (!clientRecord) {
      throw new AppError("CLIENT_NOT_FOUND", "Cliente não encontrado.", 404);
    }
  }

  return input.clientId;
}

async function upsertReceivableCashMovement(client: PrismaClientLike, payment: PaymentRecord) {
  const paidAmount = toNumber(payment.paidAmount);

  if (paidAmount <= 0 || !payment.paidAt || payment.status === "CANCELLED") {
    return null;
  }

  return client.cashMovement.upsert({
    where: {
      paymentId: payment.id
    },
    create: {
      amount: paidAmount,
      cashAccountId: payment.cashAccountId ?? defaultCashAccountId,
      categoryId: payment.categoryId ?? getDefaultReceivableCategoryId(payment.source),
      clientId: payment.clientId,
      date: payment.paidAt,
      description: `Recebimento - ${payment.description}`,
      origin: payment.source === "VISIT" ? "VISIT_PAYMENT" : "RECEIVABLE_PAYMENT",
      paymentId: payment.id,
      paymentMethod: payment.paymentMethod,
      projectId: payment.projectId,
      referenceId: payment.id,
      type: "INCOME",
      visitId: payment.visitId
    },
    update: {
      amount: paidAmount,
      cashAccountId: payment.cashAccountId ?? defaultCashAccountId,
      categoryId: payment.categoryId ?? getDefaultReceivableCategoryId(payment.source),
      clientId: payment.clientId,
      date: payment.paidAt,
      description: `Recebimento - ${payment.description}`,
      origin: payment.source === "VISIT" ? "VISIT_PAYMENT" : "RECEIVABLE_PAYMENT",
      paymentMethod: payment.paymentMethod,
      projectId: payment.projectId,
      referenceId: payment.id,
      type: "INCOME",
      visitId: payment.visitId
    }
  });
}

async function createExpenseCashMovement(
  client: PrismaClientLike,
  expense: {
    amount: { toString(): string } | number | string;
    cashAccountId: string | null;
    categoryId: string | null;
    clientId: string | null;
    description: string;
    id: string;
    expensePaymentId: string;
    paidAt: Date;
    paymentMethod: string | null;
    projectId: string | null;
  }
) {
  await client.cashMovement.create({
    data: {
      amount: toNumber(expense.amount),
      cashAccountId: expense.cashAccountId ?? defaultCashAccountId,
      categoryId: expense.categoryId ?? defaultExpenseCategoryId,
      clientId: expense.clientId,
      date: expense.paidAt,
      description: `Pagamento - ${expense.description}`,
      expenseId: expense.id,
      expensePaymentId: expense.expensePaymentId,
      origin: "EXPENSE_PAYMENT",
      paymentMethod: expense.paymentMethod,
      projectId: expense.projectId,
      referenceId: expense.expensePaymentId,
      type: "EXPENSE"
    },
  });
}

function getDefaultReceivableCategoryId(source: string | null | undefined) {
  return source === "VISIT" ? visitRevenueCategoryId : projectRevenueCategoryId;
}

function buildPaymentScopeWhere({ clientId, projectId }: Pick<CashPeriodQuery, "clientId" | "projectId">): Prisma.PaymentWhereInput {
  return {
    ...(clientId ? { clientId } : {}),
    ...(projectId ? { projectId } : {})
  };
}

function buildExpenseScopeWhere({
  cashAccountId,
  categoryId,
  clientId,
  projectId
}: Pick<CashPeriodQuery, "cashAccountId" | "categoryId" | "clientId" | "projectId">): Prisma.ExpenseWhereInput {
  return {
    ...(cashAccountId ? { cashAccountId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(clientId ? { clientId } : {}),
    ...(projectId ? { projectId } : {})
  };
}

function buildCashMovementWhereFromPeriod({
  cashAccountId,
  categoryId,
  clientId,
  from,
  projectId,
  to
}: CashPeriodQuery): Prisma.CashMovementWhereInput {
  return {
    ...(cashAccountId ? { cashAccountId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(clientId ? { clientId } : {}),
    ...(projectId ? { projectId } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: startOfDay(from) } : {}),
            ...(to ? { lte: endOfDay(to) } : {})
          }
        }
      : {})
  };
}

function resolveCashPeriod(query: CashPeriodQuery, today: Date) {
  if (query.from && query.to) {
    return {
      from: startOfDay(query.from),
      to: endOfDay(query.to)
    };
  }

  return {
    from: new Date(today.getFullYear(), today.getMonth(), 1),
    to: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
  };
}

function resolveActualDate(date: Date | undefined, today: Date, message: string) {
  const actualDate = date ?? today;

  if (startOfDay(actualDate) > startOfDay(today)) {
    throw new AppError("FINANCIAL_DATE_IN_FUTURE", message, 422);
  }

  return actualDate;
}

function toNumber(value: { toString(): string } | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value.toString());
}

function toCents(value: { toString(): string } | number | string | null | undefined) {
  return Math.round(toNumber(value) * 100);
}

function toMoneyString(value: number) {
  return roundMoney(value).toFixed(2);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeNullableText(value: string | null | undefined) {
  return value || null;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}
