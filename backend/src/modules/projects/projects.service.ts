import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { calculateProjectProgress } from "../../shared/business-rules.js";
import {
  manualProjectReasonLabels,
  manualProjectReasons,
  projectOriginLabels,
  projectOrigins,
  projectStatusLabels,
  projectStatuses,
  projectTypeLabels,
  projectTypes
} from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "./projects.schema.js";

export function getProjectsMeta() {
  return {
    statuses: projectStatuses.map((value) => ({
      value,
      label: projectStatusLabels[value]
    })),
    origins: projectOrigins.map((value) => ({
      value,
      label: projectOriginLabels[value]
    })),
    manualReasons: manualProjectReasons.map((value) => ({
      value,
      label: manualProjectReasonLabels[value]
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
  budgetId: true,
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
  origin: true,
  manualReason: true,
  approvedAt: true,
  convertedAt: true,
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
  budget: {
    select: {
      id: true,
      title: true,
      finalAmount: true,
      status: true
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
      visits: true
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
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  return mapProject(project);
}

export async function createProject(input: CreateProjectInput) {
  await ensureClientExists(input.clientId);
  assertProjectDates(input.startsAt, input.expectedDeliveryDate);
  assertManualProjectCreation(input.origin, input.manualReason);

  const project = await prisma.project.create({
    data: {
      ...input,
      approvedAt: null,
      budgetId: null,
      convertedAt: null
    },
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
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
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
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  if (impact.hasRelations) {
    throw new AppError("PROJECT_HAS_RELATIONS", "Projeto possui registros vinculados e não pode ser excluído.", 409, {
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
          visits: true
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
  origin,
  search,
  status,
  type
}: Pick<ListProjectsQuery, "clientId" | "origin" | "search" | "status" | "type">): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {};

  if (clientId) {
    where.clientId = clientId;
  }

  if (status) {
    where.status = status;
  }

  if (origin) {
    where.origin = origin;
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
    budgetId: project.budgetId,
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
    origin: project.origin,
    manualReason: project.manualReason,
    approvedAt: project.approvedAt?.toISOString() ?? null,
    convertedAt: project.convertedAt?.toISOString() ?? null,
    pinned: project.pinned,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    progress: calculateProjectProgress(totalSteps, completedSteps),
    budget: project.budget
      ? {
          ...project.budget,
          finalAmount: project.budget.finalAmount.toString()
        }
      : null,
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
    throw new AppError("CLIENT_NOT_FOUND", "Cliente não encontrado.", 404);
  }
}

function assertProjectDates(startsAt?: Date | null, expectedDeliveryDate?: Date | null) {
  if (startsAt && expectedDeliveryDate && expectedDeliveryDate < startsAt) {
    throw new AppError("INVALID_PROJECT_DATES", "Data de entrega não pode ser anterior à data de início.", 422);
  }
}

function assertManualProjectCreation(origin: string, manualReason?: string | null) {
  if (origin === "BUDGET_APPROVAL") {
    throw new AppError(
      "PROJECT_MUST_BE_CREATED_FROM_APPROVED_BUDGET",
      "Projeto por orçamento aprovado deve ser gerado a partir do orçamento.",
      409
    );
  }

  if (!manualReason) {
    throw new AppError("PROJECT_MANUAL_REASON_REQUIRED", "Projeto manual exige motivo.", 422);
  }
}

function emptyImpactCounts() {
  return {
    steps: 0,
    budgets: 0,
    payments: 0,
    tasks: 0,
    visits: 0
  };
}
