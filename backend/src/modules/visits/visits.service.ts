import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { visitStatusLabels, visitStatuses, visitTypeLabels, visitTypes } from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import {
  assertChargedVisitHasProject,
  assertVisitCanBeDeletedFromFinancial,
  syncVisitPaymentFromVisit
} from "../financial/financial.service.js";
import type { CreateVisitInput, ListVisitsQuery, UpdateVisitInput } from "./visits.schema.js";

const visitSelect = {
  id: true,
  clientId: true,
  projectId: true,
  type: true,
  date: true,
  time: true,
  address: true,
  amount: true,
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
      clientId: true
    }
  }
} satisfies Prisma.VisitSelect;

type VisitRecord = Prisma.VisitGetPayload<{ select: typeof visitSelect }>;
type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

export function getVisitsMeta() {
  return {
    statuses: visitStatuses.map((value) => ({
      value,
      label: visitStatusLabels[value]
    })),
    types: visitTypes.map((value) => ({
      value,
      label: visitTypeLabels[value]
    }))
  };
}

export async function listVisits(query: ListVisitsQuery) {
  const { page, pageSize } = query;
  const where = buildVisitWhere(query);

  const [visits, total] = await prisma.$transaction([
    prisma.visit.findMany({
      where,
      select: visitSelect,
      orderBy: [{ date: "asc" }, { time: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.visit.count({ where })
  ]);

  return {
    data: visits.map(mapVisit),
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function getVisitById(id: string) {
  const visit = await prisma.visit.findUnique({
    where: { id },
    select: visitSelect
  });

  if (!visit) {
    throw new AppError("VISIT_NOT_FOUND", "Visita técnica não encontrada.", 404);
  }

  return mapVisit(visit);
}

export async function createVisit(input: CreateVisitInput) {
  assertChargedVisitHasProject({
    amount: input.amount,
    projectId: input.projectId ?? null
  });

  const visit = await prisma.$transaction(async (transaction) => {
    await ensureVisitRelations(input.clientId, input.projectId ?? null, transaction);

    const createdVisit = await transaction.visit.create({
      data: input,
      select: visitSelect
    });

    await syncVisitPaymentFromVisit(transaction, createdVisit);

    return createdVisit;
  });

  return mapVisit(visit);
}

export async function updateVisit(id: string, input: UpdateVisitInput) {
  const visit = await prisma.$transaction(async (transaction) => {
  const currentVisit = await transaction.visit.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      clientId: true,
      projectId: true
    }
  });

  if (!currentVisit) {
    throw new AppError("VISIT_NOT_FOUND", "Visita técnica não encontrada.", 404);
  }

  const nextAmount = "amount" in input ? input.amount : currentVisit.amount;
  const nextClientId = input.clientId ?? currentVisit.clientId;
  const nextProjectId = "projectId" in input ? input.projectId ?? null : currentVisit.projectId;

  assertChargedVisitHasProject({
    amount: nextAmount,
    projectId: nextProjectId
  });

  await ensureVisitRelations(nextClientId, nextProjectId, transaction);

  const updatedVisit = await transaction.visit.update({
    where: { id },
    data: input,
    select: visitSelect
  });

  await syncVisitPaymentFromVisit(transaction, updatedVisit);

  return updatedVisit;
  });

  return mapVisit(visit);
}

export async function completeVisit(id: string) {
  const updatedVisit = await prisma.$transaction(async (transaction) => {
    const visit = await getVisitStatusSnapshot(id, transaction);

  if (visit.status === "CANCELLED") {
    throw new AppError("VISIT_CANCELLED_COMPLETE_BLOCKED", "Visita cancelada não pode ser concluída.", 409);
  }

  const completedVisit = await transaction.visit.update({
    where: { id },
    data: {
      status: "COMPLETED"
    },
    select: visitSelect
  });

  await syncVisitPaymentFromVisit(transaction, completedVisit);

  return completedVisit;
  });

  return mapVisit(updatedVisit);
}

export async function reopenVisit(id: string) {
  const visit = await prisma.$transaction(async (transaction) => {
    await getVisitStatusSnapshot(id, transaction);

    const reopenedVisit = await transaction.visit.update({
    where: { id },
    data: {
      status: "SCHEDULED"
    },
    select: visitSelect
  });

    await syncVisitPaymentFromVisit(transaction, reopenedVisit);

    return reopenedVisit;
  });

  return mapVisit(visit);
}

export async function cancelVisit(id: string) {
  const updatedVisit = await prisma.$transaction(async (transaction) => {
    const visit = await getVisitStatusSnapshot(id, transaction);

  if (visit.status === "COMPLETED") {
    throw new AppError("VISIT_COMPLETED_CANCEL_BLOCKED", "Visita concluída não pode ser cancelada.", 409);
  }

  const cancelledVisit = await transaction.visit.update({
    where: { id },
    data: {
      status: "CANCELLED"
    },
    select: visitSelect
  });

  await syncVisitPaymentFromVisit(transaction, cancelledVisit);

  return cancelledVisit;
  });

  return mapVisit(updatedVisit);
}

export async function deleteVisit(id: string) {
  await prisma.$transaction(async (transaction) => {
    const visit = await getVisitStatusSnapshot(id, transaction);

    if (toNumber(visit.amount) > 0) {
      throw new AppError(
        "VISIT_PAYMENT_DELETE_BLOCKED",
        "Visita técnica com valor não pode ser excluída. Cancele a visita para preservar o histórico financeiro.",
        409
      );
    }

    await assertVisitCanBeDeletedFromFinancial(transaction, id);
    await transaction.visit.delete({ where: { id } });
  });

  return { deleted: true };
}

export function buildVisitWhere({
  clientId,
  dateFrom,
  dateTo,
  projectId,
  search,
  scope,
  status,
  type
}: Partial<Pick<ListVisitsQuery, "clientId" | "dateFrom" | "dateTo" | "projectId" | "scope" | "search" | "status" | "type">>, today = new Date()): Prisma.VisitWhereInput {
  const where: Prisma.VisitWhereInput = {};
  const dateFilters: Prisma.DateTimeFilter[] = [];

  if (clientId) {
    where.clientId = clientId;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  if (status) {
    where.status = status;
  }

  if (scope === "UPCOMING_VISITS" && !status) {
    where.status = "SCHEDULED";
  }

  if (scope === "UPCOMING_VISITS" && status) {
    where.AND = [
      {
        status: "SCHEDULED"
      }
    ];
  }

  if (type) {
    where.type = type;
  }

  if (scope === "UPCOMING_VISITS") {
    dateFilters.push({
      gte: startOfDay(today),
      lte: endOfDay(addDays(startOfDay(today), 7))
    });
  }

  if (dateFrom || dateTo) {
    dateFilters.push({
      ...(dateFrom ? { gte: startOfDay(dateFrom) } : {}),
      ...(dateTo ? { lte: endOfDay(dateTo) } : {})
    });
  }

  if (dateFilters.length === 1) {
    where.date = dateFilters[0];
  } else if (dateFilters.length > 1) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      ...dateFilters.map((date) => ({ date }))
    ];
  }

  if (search) {
    where.OR = [
      { type: { contains: search } },
      { address: { contains: search } },
      { notes: { contains: search } },
      { client: { name: { contains: search } } },
      { project: { name: { contains: search } } }
    ];
  }

  return where;
}

export function assertVisitProjectBelongsToClient(project: { clientId: string }, clientId: string) {
  if (project.clientId !== clientId) {
    throw new AppError("VISIT_PROJECT_CLIENT_MISMATCH", "Projeto informado não pertence ao cliente da visita técnica.", 422);
  }
}

function mapVisit(visit: VisitRecord) {
  return {
    id: visit.id,
    clientId: visit.clientId,
    projectId: visit.projectId,
    type: visit.type,
    date: visit.date.toISOString(),
    time: visit.time,
    address: visit.address,
    amount: visit.amount?.toString() ?? null,
    status: visit.status,
    notes: visit.notes,
    createdAt: visit.createdAt.toISOString(),
    updatedAt: visit.updatedAt.toISOString(),
    client: visit.client,
    project: visit.project
  };
}

async function ensureVisitRelations(clientId: string, projectId?: string | null, db: PrismaClientLike = prisma) {
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true }
  });

  if (!client) {
    throw new AppError("CLIENT_NOT_FOUND", "Cliente não encontrado.", 404);
  }

  if (!projectId) {
    return;
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true
    }
  });

  if (!project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  assertVisitProjectBelongsToClient(project, clientId);
}

async function getVisitStatusSnapshot(id: string, db: PrismaClientLike = prisma) {
  const visit = await db.visit.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      status: true
    }
  });

  if (!visit) {
    throw new AppError("VISIT_NOT_FOUND", "Visita técnica não encontrada.", 404);
  }

  return visit;
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

function toNumber(value: { toString(): string } | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value.toString());
}
