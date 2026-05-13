import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { assertPositiveAmount, isPaymentOverdue } from "../../shared/business-rules.js";
import {
  paymentMethodLabels,
  paymentMethods,
  paymentStatusLabels,
  paymentStatuses,
  type PaymentStatus
} from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import type {
  CreatePaymentInput,
  GenerateInstallmentsInput,
  ListPaymentsQuery,
  RegisterPaymentInput,
  UpdatePaymentInput
} from "./financial.schema.js";

type PaymentFinancialSnapshot = {
  amount: { toString(): string } | number | string;
  paidAmount: { toString(): string } | number | string;
  dueDate: Date;
  status: string;
};

type ProjectFinancialSnapshot = {
  contractedAmount: { toString(): string } | number | string | null;
  payments: PaymentFinancialSnapshot[];
};

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

const paymentSelect = {
  id: true,
  projectId: true,
  clientId: true,
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
  }
} satisfies Prisma.PaymentSelect;

type PaymentRecord = Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>;

const projectFinancialSelect = {
  id: true,
  name: true,
  contractedAmount: true,
  payments: {
    select: {
      amount: true,
      paidAmount: true,
      dueDate: true,
      status: true
    }
  }
} satisfies Prisma.ProjectSelect;

type ProjectFinancialRecord = Prisma.ProjectGetPayload<{ select: typeof projectFinancialSelect }>;

export function getFinancialMeta() {
  return {
    statuses: paymentStatuses.map((value) => ({
      value,
      label: paymentStatusLabels[value]
    })),
    methods: paymentMethods.map((value) => ({
      value,
      label: paymentMethodLabels[value]
    }))
  };
}

export async function listPayments(query: ListPaymentsQuery) {
  const { page, pageSize } = query;
  const where = buildPaymentWhere(query);

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      select: paymentSelect,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.payment.count({ where })
  ]);

  return {
    data: payments.map(mapPayment),
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function getFinancialSummary() {
  const [payments, budgets, projects] = await prisma.$transaction([
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
    })
  ]);

  const today = startOfDay(new Date());
  const dueSoonLimit = addDays(today, 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  let revenueMonth = 0;
  let revenueYear = 0;
  let receivableAmount = 0;
  let receivedAmount = 0;
  let overdueAmount = 0;
  let dueSoonAmount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;

  for (const payment of payments) {
    const amount = toNumber(payment.amount);
    const paidAmount = toNumber(payment.paidAmount);
    const remainingAmount = roundMoney(Math.max(amount - paidAmount, 0));
    const effectiveStatus = getEffectivePaymentStatus(payment, today);

    if (payment.status !== "CANCELLED") {
      receivedAmount += paidAmount;
    }

    if (payment.paidAt && payment.status !== "CANCELLED") {
      if (payment.paidAt >= monthStart) {
        revenueMonth += paidAmount;
      }

      if (payment.paidAt >= yearStart) {
        revenueYear += paidAmount;
      }
    }

    if (!["PAID", "CANCELLED"].includes(payment.status)) {
      receivableAmount += remainingAmount;
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

  const approvedBudgets = budgets.filter((budget) => budget.status === "APPROVED").length;
  const refusedBudgets = budgets.filter((budget) => budget.status === "REFUSED").length;
  const ticketAmounts = projects.map((project) => toNumber(project.contractedAmount)).filter((value) => value > 0);
  const averageProjectTicket =
    ticketAmounts.length > 0 ? ticketAmounts.reduce((total, amount) => total + amount, 0) / ticketAmounts.length : 0;

  return {
    revenueMonth: toMoneyString(revenueMonth),
    revenueYear: toMoneyString(revenueYear),
    receivableAmount: toMoneyString(receivableAmount),
    receivedAmount: toMoneyString(receivedAmount),
    overdueAmount: toMoneyString(overdueAmount),
    dueSoonAmount: toMoneyString(dueSoonAmount),
    overdueCount,
    dueSoonCount,
    approvedBudgets,
    refusedBudgets,
    averageProjectTicket: toMoneyString(averageProjectTicket)
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
        amount: true,
        paidAmount: true,
        status: true
      }
    });

    if (!currentPayment) {
      throw new AppError("PAYMENT_NOT_FOUND", "Parcela não encontrada.", 404);
    }

    if (currentPayment.status === "CANCELLED") {
      throw new AppError("PAYMENT_CANCELLED_UPDATE_BLOCKED", "Parcela cancelada não pode ser editada.", 409);
    }

    if (input.amount !== undefined) {
      assertPositiveAmount(input.amount);

      if (input.amount < toNumber(currentPayment.paidAmount)) {
        throw new AppError("PAYMENT_AMOUNT_BELOW_PAID", "Valor da parcela não pode ser menor que o valor já pago.", 422);
      }
    }

    const payment = await transaction.payment.update({
      where: { id },
      data: input,
      select: paymentSelect
    });

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

    const projectFinancial = await getProjectFinancialOverview(currentPayment.projectId, transaction);

    return {
      payment: mapPayment(payment),
      projectFinancial,
      alert: buildProjectFinancialAlert(projectFinancial)
    };
  });
}

export async function cancelPayment(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true
    }
  });

  if (!payment) {
    throw new AppError("PAYMENT_NOT_FOUND", "Parcela não encontrada.", 404);
  }

  if (payment.status === "PAID") {
    throw new AppError("PAYMENT_PAID_CANCEL_BLOCKED", "Parcela paga não pode ser cancelada.", 409);
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      status: "CANCELLED"
    },
    select: paymentSelect
  });

  return mapPayment(updatedPayment);
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

export function getEffectivePaymentStatus(payment: { dueDate: Date; status: string }, today = new Date()): PaymentStatus {
  if (isPaymentOverdue(payment, today)) {
    return "OVERDUE";
  }

  if (payment.status === "OVERDUE") {
    return "RECEIVABLE";
  }

  return payment.status as PaymentStatus;
}

export function splitAmountIntoInstallments(totalAmount: number, installments: number) {
  assertPositiveAmount(totalAmount, "valor contratado");

  if (![1, 2, 3].includes(installments)) {
    throw new AppError("INVALID_INSTALLMENT_COUNT", "parcelamento deve ser à vista, 2x ou 3x.", 422);
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

    scheduledAmount += amount;
    receivedAmount += paidAmount;

    if (payment.status !== "PAID") {
      pendingAmount += remainingAmount;
    }

    if (effectiveStatus === "OVERDUE") {
      overdueAmount += remainingAmount;
    }
  }

  const overContractedAmount = Math.max(roundMoney(scheduledAmount - contractedAmount), 0);

  return {
    contractedAmount: roundMoney(contractedAmount),
    scheduledAmount: roundMoney(scheduledAmount),
    receivedAmount: roundMoney(receivedAmount),
    pendingAmount: roundMoney(pendingAmount),
    overdueAmount: roundMoney(overdueAmount),
    overContractedAmount,
    hasOverContractedAlert: contractedAmount > 0 && overContractedAmount > 0
  };
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
    }
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
    overContractedAmount: toMoneyString(summary.overContractedAmount),
    hasOverContractedAlert: summary.hasOverContractedAlert
  };
}

function buildProjectFinancialAlert(projectFinancial: ReturnType<typeof mapProjectFinancial>) {
  if (!projectFinancial.hasOverContractedAlert) {
    return null;
  }

  return {
    code: "PROJECT_OVER_CONTRACTED",
    message: "Soma das parcelas está acima do valor contratado do projeto.",
    amount: projectFinancial.overContractedAmount
  };
}

function toNumber(value: { toString(): string } | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value.toString());
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
