import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { calculateBudgetFinalAmount } from "../../shared/business-rules.js";
import { budgetStatusLabels, budgetStatuses } from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import type { ApproveBudgetInput, CreateBudgetInput, ListBudgetsQuery, UpdateBudgetInput } from "./budgets.schema.js";

type BudgetItemInput = {
  description: string;
  quantity: number;
  unitAmount: number;
};

type BudgetConversionSnapshot = {
  clientId: string;
  title: string;
  description: string | null;
  finalAmount: { toString(): string } | number | string;
};

const budgetSelect = {
  id: true,
  clientId: true,
  projectId: true,
  title: true,
  serviceType: true,
  description: true,
  totalAmount: true,
  discount: true,
  finalAmount: true,
  paymentMethod: true,
  expiresAt: true,
  status: true,
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
      status: true
    }
  },
  items: {
    select: {
      id: true,
      budgetId: true,
      description: true,
      quantity: true,
      unitAmount: true,
      totalAmount: true
    },
    orderBy: { id: "asc" }
  }
} satisfies Prisma.BudgetSelect;

type BudgetRecord = Prisma.BudgetGetPayload<{ select: typeof budgetSelect }>;

const convertedProjectSelect = {
  id: true,
  clientId: true,
  name: true,
  type: true,
  status: true,
  contractedAmount: true,
  startsAt: true,
  expectedDeliveryDate: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ProjectSelect;

type ConvertedProjectRecord = Prisma.ProjectGetPayload<{ select: typeof convertedProjectSelect }>;

export function getBudgetsMeta() {
  return {
    statuses: budgetStatuses.map((value) => ({
      value,
      label: budgetStatusLabels[value]
    }))
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export async function listBudgets(query: ListBudgetsQuery) {
  const { page, pageSize } = query;
  const where = buildBudgetWhere(query);

  const [budgets, total] = await prisma.$transaction([
    prisma.budget.findMany({
      where,
      select: budgetSelect,
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.budget.count({ where })
  ]);

  return {
    data: budgets.map(mapBudget),
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function getBudgetById(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
    select: budgetSelect
  });

  if (!budget) {
    throw new AppError("BUDGET_NOT_FOUND", "Orçamento não encontrado.", 404);
  }

  return mapBudget(budget);
}

export async function createBudget(input: CreateBudgetInput) {
  await ensureBudgetRelations(input.clientId, input.projectId ?? null);

  const prepared = prepareBudgetAmounts(input.items, input.discount);

  const budget = await prisma.$transaction((transaction) =>
    transaction.budget.create({
      data: {
        clientId: input.clientId,
        projectId: input.projectId ?? null,
        title: input.title,
        serviceType: input.serviceType,
        description: input.description,
        totalAmount: prepared.totalAmount,
        discount: input.discount,
        finalAmount: prepared.finalAmount,
        paymentMethod: input.paymentMethod,
        expiresAt: input.expiresAt,
        status: input.status,
        items: {
          create: prepared.items
        }
      },
      select: budgetSelect
    })
  );

  return mapBudget(budget);
}

export async function updateBudget(id: string, input: UpdateBudgetInput) {
  const currentBudget = await prisma.budget.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      projectId: true,
      discount: true,
      items: {
        select: {
          description: true,
          quantity: true,
          unitAmount: true
        }
      }
    }
  });

  if (!currentBudget) {
    throw new AppError("BUDGET_NOT_FOUND", "Orçamento não encontrado.", 404);
  }

  const nextClientId = input.clientId ?? currentBudget.clientId;
  const nextProjectId = "projectId" in input ? input.projectId ?? null : currentBudget.projectId;

  await ensureBudgetRelations(nextClientId, nextProjectId);

  const nextItems =
    input.items ??
    currentBudget.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitAmount: Number(item.unitAmount)
    }));
  const nextDiscount = "discount" in input ? input.discount ?? 0 : Number(currentBudget.discount);
  const prepared = prepareBudgetAmounts(nextItems, nextDiscount);

  const budget = await prisma.$transaction((transaction) =>
    transaction.budget.update({
      where: { id },
      data: {
        clientId: nextClientId,
        projectId: nextProjectId,
        title: input.title,
        serviceType: input.serviceType,
        description: input.description,
        totalAmount: prepared.totalAmount,
        discount: nextDiscount,
        finalAmount: prepared.finalAmount,
        paymentMethod: input.paymentMethod,
        expiresAt: input.expiresAt,
        status: input.status,
        items: input.items
          ? {
              deleteMany: {},
              create: prepared.items
            }
          : undefined
      },
      select: budgetSelect
    })
  );

  return mapBudget(budget);
}

export async function sendBudget(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      _count: {
        select: {
          items: true
        }
      }
    }
  });

  if (!budget) {
    throw new AppError("BUDGET_NOT_FOUND", "Orçamento não encontrado.", 404);
  }

  if (budget._count.items <= 0) {
    throw new AppError("BUDGET_ITEMS_REQUIRED", "Orçamento enviado exige pelo menos 1 item.", 422);
  }

  if (!["DRAFT", "NEGOTIATION"].includes(budget.status)) {
    throw new AppError("BUDGET_CANNOT_BE_SENT", "Somente orçamentos em rascunho ou negociação podem ser enviados.", 409);
  }

  const updatedBudget = await prisma.budget.update({
    where: { id },
    data: { status: "SENT" },
    select: budgetSelect
  });

  return mapBudget(updatedBudget);
}

export async function approveBudget(id: string, input: ApproveBudgetInput) {
  return prisma.$transaction(async (transaction) => {
    const budget = await transaction.budget.findUnique({
      where: { id },
      select: {
        id: true,
        clientId: true,
        projectId: true,
        title: true,
        description: true,
        finalAmount: true,
        status: true,
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    if (!budget) {
      throw new AppError("BUDGET_NOT_FOUND", "Orçamento não encontrado.", 404);
    }

    assertBudgetCanBeConverted({
      itemCount: budget._count.items,
      projectId: budget.projectId,
      status: budget.status
    });

    const project = await transaction.project.create({
      data: buildConvertedProjectData(budget, input),
      select: convertedProjectSelect
    });

    const updatedBudget = await transaction.budget.update({
      where: { id },
      data: {
        projectId: project.id,
        status: "APPROVED"
      },
      select: budgetSelect
    });

    return {
      budget: mapBudget(updatedBudget),
      project: mapConvertedProject(project)
    };
  });
}

export async function deleteBudget(id: string) {
  const budget = await prisma.budget.findUnique({
    where: { id },
    select: {
      id: true,
      status: true
    }
  });

  if (!budget) {
    throw new AppError("BUDGET_NOT_FOUND", "Orçamento não encontrado.", 404);
  }

  if (budget.status === "APPROVED") {
    throw new AppError("BUDGET_APPROVED_DELETE_BLOCKED", "Orçamento aprovado não pode ser excluído.", 409);
  }

  await prisma.budget.delete({ where: { id } });

  return { deleted: true };
}

export function buildBudgetWhere({
  clientId,
  createdFrom,
  createdTo,
  projectId,
  search,
  scope,
  status
}: Partial<Pick<ListBudgetsQuery, "clientId" | "createdFrom" | "createdTo" | "projectId" | "scope" | "search" | "status">>): Prisma.BudgetWhereInput {
  const where: Prisma.BudgetWhereInput = {};

  if (clientId) {
    where.clientId = clientId;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  if (status) {
    where.status = status;
  }

  if (scope === "OPEN_BUDGETS" && !status) {
    where.status = {
      in: ["DRAFT", "SENT", "NEGOTIATION"]
    };
  }

  if (scope === "OPEN_BUDGETS" && status) {
    where.AND = [
      {
        status: {
          in: ["DRAFT", "SENT", "NEGOTIATION"]
        }
      }
    ];
  }

  if (createdFrom || createdTo) {
    where.createdAt = {
      ...(createdFrom ? { gte: startOfDay(createdFrom) } : {}),
      ...(createdTo ? { lte: endOfDay(createdTo) } : {})
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { serviceType: { contains: search } },
      { description: { contains: search } },
      { client: { name: { contains: search } } },
      { project: { name: { contains: search } } },
      { items: { some: { description: { contains: search } } } }
    ];
  }

  return where;
}

export function prepareBudgetAmounts(items: BudgetItemInput[], discount = 0) {
  const amounts = calculateBudgetFinalAmount(items, discount);

  return {
    totalAmount: amounts.totalAmount,
    finalAmount: amounts.finalAmount,
    items: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      totalAmount: item.quantity * item.unitAmount
    }))
  };
}

export function assertBudgetCanBeConverted({
  itemCount,
  projectId,
  status
}: {
  itemCount: number;
  projectId?: string | null;
  status: string;
}) {
  if (projectId) {
    throw new AppError("BUDGET_ALREADY_CONVERTED", "Orçamento já está vinculado a um projeto.", 409);
  }

  if (itemCount <= 0) {
    throw new AppError("BUDGET_ITEMS_REQUIRED", "Orçamento aprovado exige pelo menos 1 item.", 422);
  }

  if (["REFUSED", "EXPIRED", "CANCELLED"].includes(status)) {
    throw new AppError("BUDGET_CANNOT_BE_APPROVED", "Orçamento recusado, vencido ou cancelado não pode virar projeto.", 409);
  }
}

export function buildConvertedProjectData(budget: BudgetConversionSnapshot, input: ApproveBudgetInput) {
  return {
    clientId: budget.clientId,
    name: input.name?.trim() || budget.title,
    type: input.type,
    status: input.status,
    workAddress: input.workAddress,
    area: input.area,
    contractedAmount: Number(budget.finalAmount),
    startsAt: input.startsAt,
    expectedDeliveryDate: input.expectedDeliveryDate,
    description: input.description ?? budget.description ?? `Projeto convertido do orçamento ${budget.title}.`,
    notes: input.notes,
    internalNotes: input.internalNotes
  };
}

function mapBudget(budget: BudgetRecord) {
  return {
    id: budget.id,
    clientId: budget.clientId,
    projectId: budget.projectId,
    title: budget.title,
    serviceType: budget.serviceType,
    description: budget.description,
    totalAmount: budget.totalAmount.toString(),
    discount: budget.discount.toString(),
    finalAmount: budget.finalAmount.toString(),
    paymentMethod: budget.paymentMethod,
    expiresAt: budget.expiresAt?.toISOString() ?? null,
    status: budget.status,
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
    client: budget.client,
    project: budget.project,
    items: budget.items.map((item) => ({
      id: item.id,
      budgetId: item.budgetId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitAmount: item.unitAmount.toString(),
      totalAmount: item.totalAmount.toString()
    }))
  };
}

function mapConvertedProject(project: ConvertedProjectRecord) {
  return {
    id: project.id,
    clientId: project.clientId,
    name: project.name,
    type: project.type,
    status: project.status,
    contractedAmount: project.contractedAmount?.toString() ?? null,
    startsAt: project.startsAt?.toISOString() ?? null,
    expectedDeliveryDate: project.expectedDeliveryDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

async function ensureBudgetRelations(clientId: string, projectId?: string | null) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true }
  });

  if (!client) {
    throw new AppError("CLIENT_NOT_FOUND", "Cliente não encontrado.", 404);
  }

  if (!projectId) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true
    }
  });

  if (!project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  if (project.clientId !== clientId) {
    throw new AppError("BUDGET_PROJECT_CLIENT_MISMATCH", "Projeto deve pertencer ao cliente do orçamento.", 422);
  }
}
