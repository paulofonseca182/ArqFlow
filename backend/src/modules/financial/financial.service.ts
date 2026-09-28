import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { assertPositiveAmount, isPaymentOverdue } from "../../shared/business-rules.js";
import {
  paymentMethodLabels,
  paymentMethods,
  paymentStatusLabels,
  paymentStatuses,
  visitTypeLabels,
  type PaymentStatus
} from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import { maxInstallmentCount } from "./financial.schema.js";
import type {
  CreatePaymentInput,
  GenerateInstallmentsInput,
  ListPaymentsQuery,
  ReorganizeInstallmentsInput,
  RegisterPaymentInput,
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

const paymentSelect = {
  id: true,
  projectId: true,
  clientId: true,
  visitId: true,
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
  }
} satisfies Prisma.PaymentSelect;

type PaymentRecord = Prisma.PaymentGetPayload<{ select: typeof paymentSelect }>;

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

export function getEffectivePaymentStatus(payment: { dueDate: Date; status: string }, today = new Date()): PaymentStatus {
  if (isPaymentOverdue(payment, today)) {
    return "OVERDUE";
  }

  if (payment.status === "OVERDUE") {
    return "RECEIVABLE";
  }

  return payment.status as PaymentStatus;
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
