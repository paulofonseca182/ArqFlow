import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { calculateProjectProgress } from "../../shared/business-rules.js";
import { projectStatusLabels, projectStatuses, projectTypeLabels, projectTypes } from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "./projects.schema.js";

export function getProjectsMeta() {
  return {
    statuses: projectStatuses.map((value) => ({
      value,
      label: projectStatusLabels[value]
    })),
    types: projectTypes.map((value) => ({
      value,
      label: projectTypeLabels[value]
    }))
  };
}

const projectSelect = {
  id: true,
  clientId: true,
  name: true,
  type: true,
  workAddress: true,
  area: true,
  contractedAmount: true,
  startsAt: true,
  expectedDeliveryDate: true,
  status: true,
  description: true,
  notes: true,
  internalNotes: true,
  pinned: true,
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
  steps: {
    select: {
      status: true
    }
  },
  _count: {
    select: {
      steps: true,
      budgets: true,
      payments: true,
      tasks: true,
      visits: true,
      documents: true,
      briefings: true
    }
  }
} satisfies Prisma.ProjectSelect;

type ProjectRecord = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

export async function listProjects(query: ListProjectsQuery) {
  const { page, pageSize } = query;
  const where = buildProjectWhere(query);

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.project.count({ where })
  ]);

  return {
    data: projects.map(mapProject),
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: projectSelect
  });

  if (!project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto nao encontrado.", 404);
  }

  return mapProject(project);
}

export async function createProject(input: CreateProjectInput) {
  await ensureClientExists(input.clientId);
  assertProjectDates(input.startsAt, input.expectedDeliveryDate);

  const project = await prisma.project.create({
    data: input,
    select: projectSelect
  });

  return mapProject(project);
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const currentProject = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      startsAt: true,
      expectedDeliveryDate: true
    }
  });

  if (!currentProject) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto nao encontrado.", 404);
  }

  if (input.clientId && input.clientId !== currentProject.clientId) {
    await ensureClientExists(input.clientId);
  }

  const nextStartsAt = "startsAt" in input ? input.startsAt : currentProject.startsAt;
  const nextExpectedDeliveryDate =
    "expectedDeliveryDate" in input ? input.expectedDeliveryDate : currentProject.expectedDeliveryDate;

  assertProjectDates(nextStartsAt, nextExpectedDeliveryDate);

  const project = await prisma.project.update({
    where: { id },
    data: input,
    select: projectSelect
  });

  return mapProject(project);
}

export async function deleteProject(id: string) {
  const impact = await getProjectDeleteImpact(id);

  if (!impact.exists) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto nao encontrado.", 404);
  }

  if (impact.hasRelations) {
    throw new AppError("PROJECT_HAS_RELATIONS", "Projeto possui registros vinculados e nao pode ser excluido.", 409, {
      impact: impact.counts
    });
  }

  await prisma.project.delete({ where: { id } });

  return { deleted: true };
}

export async function getProjectDeleteImpact(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          steps: true,
          budgets: true,
          payments: true,
          tasks: true,
          visits: true,
          documents: true,
          briefings: true
        }
      }
    }
  });

  if (!project) {
    return {
      exists: false,
      hasRelations: false,
      counts: emptyImpactCounts()
    };
  }

  const counts = project._count;
  const hasRelations = Object.values(counts).some((count) => count > 0);

  return {
    exists: true,
    hasRelations,
    counts
  };
}

export function buildProjectWhere({
  clientId,
  search,
  status,
  type
}: Pick<ListProjectsQuery, "clientId" | "search" | "status" | "type">): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {};

  if (clientId) {
    where.clientId = clientId;
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { workAddress: { contains: search } },
      { client: { name: { contains: search } } }
    ];
  }

  return where;
}

function mapProject(project: ProjectRecord) {
  const totalSteps = project.steps.length;
  const completedSteps = project.steps.filter((step) => step.status === "COMPLETED").length;

  return {
    id: project.id,
    clientId: project.clientId,
    name: project.name,
    type: project.type,
    workAddress: project.workAddress,
    area: project.area?.toString() ?? null,
    contractedAmount: project.contractedAmount?.toString() ?? null,
    startsAt: project.startsAt?.toISOString() ?? null,
    expectedDeliveryDate: project.expectedDeliveryDate?.toISOString() ?? null,
    status: project.status,
    description: project.description,
    notes: project.notes,
    internalNotes: project.internalNotes,
    pinned: project.pinned,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    progress: calculateProjectProgress(totalSteps, completedSteps),
    client: project.client,
    _count: project._count
  };
}

async function ensureClientExists(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true }
  });

  if (!client) {
    throw new AppError("CLIENT_NOT_FOUND", "Cliente nao encontrado.", 404);
  }
}

function assertProjectDates(startsAt?: Date | null, expectedDeliveryDate?: Date | null) {
  if (startsAt && expectedDeliveryDate && expectedDeliveryDate < startsAt) {
    throw new AppError("INVALID_PROJECT_DATES", "Data de entrega nao pode ser anterior a data de inicio.", 422);
  }
}

function emptyImpactCounts() {
  return {
    steps: 0,
    budgets: 0,
    payments: 0,
    tasks: 0,
    visits: 0,
    documents: 0,
    briefings: 0
  };
}
