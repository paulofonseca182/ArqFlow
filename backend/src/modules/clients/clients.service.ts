import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { clientStatusLabels, clientStatuses } from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import type { CreateClientInput, ListClientsQuery, UpdateClientInput } from "./clients.schema.js";

export function getClientsMeta() {
  return {
    statuses: clientStatuses.map((value) => ({
      value,
      label: clientStatusLabels[value]
    }))
  };
}

const clientSelect = {
  id: true,
  name: true,
  status: true,
  phone: true,
  whatsapp: true,
  email: true,
  cpfCnpj: true,
  address: true,
  city: true,
  state: true,
  source: true,
  notes: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ClientSelect;

export async function listClients(query: ListClientsQuery) {
  const { page, pageSize, search, status } = query;
  const where = buildClientWhere({ search, status });

  const [clients, total] = await prisma.$transaction([
    prisma.client.findMany({
      where,
      select: {
        ...clientSelect,
        _count: {
          select: {
            projects: true,
            budgets: true,
            payments: true,
            visits: true,
            documents: true,
            briefings: true
          }
        }
      },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.client.count({ where })
  ]);

  return {
    data: clients,
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      ...clientSelect,
      projects: {
        select: {
          id: true,
          name: true,
          status: true,
          type: true,
          expectedDeliveryDate: true
        },
        orderBy: { updatedAt: "desc" }
      },
      _count: {
        select: {
          projects: true,
          budgets: true,
          payments: true,
          visits: true,
          documents: true,
          briefings: true
        }
      }
    }
  });

  if (!client) {
    throw new AppError("CLIENT_NOT_FOUND", "Cliente nao encontrado.", 404);
  }

  return client;
}

export async function createClient(input: CreateClientInput) {
  return prisma.client.create({
    data: input,
    select: clientSelect
  });
}

export async function updateClient(id: string, input: UpdateClientInput) {
  const currentClient = await prisma.client.findUnique({
    where: { id },
    select: { id: true, phone: true, whatsapp: true }
  });

  if (!currentClient) {
    throw new AppError("CLIENT_NOT_FOUND", "Cliente nao encontrado.", 404);
  }

  const nextPhone = "phone" in input ? input.phone : currentClient.phone;
  const nextWhatsapp = "whatsapp" in input ? input.whatsapp : currentClient.whatsapp;

  if (!nextPhone && !nextWhatsapp) {
    throw new AppError("CLIENT_CONTACT_REQUIRED", "Cliente deve ter telefone ou WhatsApp.", 422);
  }

  return prisma.client.update({
    where: { id },
    data: input,
    select: clientSelect
  });
}

export async function deleteClient(id: string) {
  const impact = await getClientDeleteImpact(id);

  if (!impact.exists) {
    throw new AppError("CLIENT_NOT_FOUND", "Cliente nao encontrado.", 404);
  }

  if (impact.hasRelations) {
    throw new AppError("CLIENT_HAS_RELATIONS", "Cliente possui registros vinculados e nao pode ser excluido.", 409, {
      impact: impact.counts
    });
  }

  await prisma.client.delete({ where: { id } });

  return { deleted: true };
}

export async function getClientDeleteImpact(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          projects: true,
          budgets: true,
          payments: true,
          visits: true,
          documents: true,
          briefings: true
        }
      }
    }
  });

  if (!client) {
    return {
      exists: false,
      hasRelations: false,
      counts: emptyImpactCounts()
    };
  }

  const counts = client._count;
  const hasRelations = Object.values(counts).some((count) => count > 0);

  return {
    exists: true,
    hasRelations,
    counts
  };
}

export function buildClientWhere({ search, status }: Pick<ListClientsQuery, "search" | "status">): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { whatsapp: { contains: search } }
    ];
  }

  return where;
}

function emptyImpactCounts() {
  return {
    projects: 0,
    budgets: 0,
    payments: 0,
    visits: 0,
    documents: 0,
    briefings: 0
  };
}
