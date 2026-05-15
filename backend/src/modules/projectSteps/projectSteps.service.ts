import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { calculateProjectProgress } from "../../shared/business-rules.js";
import { projectTypes, stepStatusLabels, stepStatuses } from "../../shared/domain.js";
import type { ProjectType } from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import type { UpdateProjectStepInput } from "./projectSteps.schema.js";

type StepTemplate = {
  name: string;
  description?: string;
};

const coreProjectStepTemplate: StepTemplate[] = [
  { name: "Alinhamento inicial" },
  { name: "Levantamento" },
  { name: "Anteprojeto" },
  { name: "Projeto 3D" },
  { name: "Projeto executivo" },
  { name: "Entrega final" }
];

export const defaultProjectStepTemplates: Record<ProjectType, StepTemplate[]> = {
  RESIDENTIAL: coreProjectStepTemplate,
  INTERIORS: coreProjectStepTemplate,
  RENOVATION: coreProjectStepTemplate,
  COMMERCIAL: coreProjectStepTemplate,
  OTHER: coreProjectStepTemplate
};

export function getProjectStepsMeta() {
  return {
    statuses: stepStatuses.map((value) => ({
      value,
      label: stepStatusLabels[value]
    })),
    templates: projectTypes.map((type) => ({
      type,
      steps: defaultProjectStepTemplates[type].map((step, index) => ({
        ...step,
        sortOrder: index + 1
      }))
    }))
  };
}

const projectStepSelect = {
  id: true,
  projectId: true,
  name: true,
  description: true,
  sortOrder: true,
  startsAt: true,
  dueDate: true,
  completedAt: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ProjectStepSelect;

type ProjectStepRecord = Prisma.ProjectStepGetPayload<{ select: typeof projectStepSelect }>;

export async function listProjectSteps(projectId: string) {
  await ensureProjectExists(projectId);

  const steps = await prisma.projectStep.findMany({
    where: { projectId },
    select: projectStepSelect,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return {
    data: steps.map(mapProjectStep),
    progress: calculateStepsProgress(steps)
  };
}

export async function generateDefaultProjectSteps(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      type: true,
      _count: {
        select: {
          steps: true
        }
      }
    }
  });

  if (!project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }

  if (project._count.steps > 0) {
    throw new AppError("PROJECT_STEPS_ALREADY_EXIST", "Projeto já possui etapas geradas.", 409);
  }

  const templates = defaultProjectStepTemplates[project.type as ProjectType] ?? defaultProjectStepTemplates.OTHER;

  await prisma.$transaction(
    templates.map((template, index) =>
      prisma.projectStep.create({
        data: {
          projectId,
          name: template.name,
          description: template.description,
          sortOrder: index + 1
        }
      })
    )
  );

  return listProjectSteps(projectId);
}

export async function updateProjectStep(id: string, input: UpdateProjectStepInput) {
  const currentStep = await getProjectStepForUpdate(id);
  const nextStartsAt = "startsAt" in input ? input.startsAt : currentStep.startsAt;
  const nextDueDate = "dueDate" in input ? input.dueDate : currentStep.dueDate;

  assertStepDates(currentStep.project.startsAt, nextStartsAt, nextDueDate);

  const statusPatch = getStatusPatch(input.status, currentStep.completedAt);
  const step = await prisma.projectStep.update({
    where: { id },
    data: {
      ...input,
      ...statusPatch
    },
    select: projectStepSelect
  });

  return mapProjectStep(step);
}

export async function completeProjectStep(id: string) {
  const currentStep = await getProjectStepForUpdate(id);

  const step = await prisma.projectStep.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: currentStep.completedAt ?? new Date()
    },
    select: projectStepSelect
  });

  return mapProjectStep(step);
}

export async function reopenProjectStep(id: string) {
  await getProjectStepForUpdate(id);

  const step = await prisma.projectStep.update({
    where: { id },
    data: {
      status: "PENDING",
      completedAt: null
    },
    select: projectStepSelect
  });

  return mapProjectStep(step);
}

export function getDefaultStepsForType(type: ProjectType) {
  return defaultProjectStepTemplates[type] ?? defaultProjectStepTemplates.OTHER;
}

export function calculateStepsProgress(steps: Array<{ status: string }>) {
  const completedSteps = steps.filter((step) => step.status === "COMPLETED").length;

  return calculateProjectProgress(steps.length, completedSteps);
}

function mapProjectStep(step: ProjectStepRecord) {
  return {
    id: step.id,
    projectId: step.projectId,
    name: step.name,
    description: step.description,
    sortOrder: step.sortOrder,
    startsAt: step.startsAt?.toISOString() ?? null,
    dueDate: step.dueDate?.toISOString() ?? null,
    completedAt: step.completedAt?.toISOString() ?? null,
    status: step.status,
    notes: step.notes,
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString()
  };
}

async function ensureProjectExists(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true }
  });

  if (!project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }
}

async function getProjectStepForUpdate(id: string) {
  const step = await prisma.projectStep.findUnique({
    where: { id },
    select: {
      id: true,
      startsAt: true,
      dueDate: true,
      completedAt: true,
      project: {
        select: {
          startsAt: true
        }
      }
    }
  });

  if (!step) {
    throw new AppError("PROJECT_STEP_NOT_FOUND", "Etapa não encontrada.", 404);
  }

  return step;
}

export function assertStepDates(projectStartsAt?: Date | null, startsAt?: Date | null, dueDate?: Date | null) {
  if (projectStartsAt && startsAt && startsAt < projectStartsAt) {
    throw new AppError("PROJECT_STEP_INVALID_DATES", "Data de início da etapa não pode ser anterior ao início do projeto.", 422);
  }

  if (projectStartsAt && dueDate && dueDate < projectStartsAt) {
    throw new AppError("PROJECT_STEP_INVALID_DATES", "Data prevista da etapa não pode ser anterior ao início do projeto.", 422);
  }

  if (startsAt && dueDate && dueDate < startsAt) {
    throw new AppError("PROJECT_STEP_INVALID_DATES", "Data prevista não pode ser anterior ao início da etapa.", 422);
  }
}

function getStatusPatch(status?: string, completedAt?: Date | null) {
  if (!status) {
    return {};
  }

  if (status === "COMPLETED") {
    return {
      completedAt: completedAt ?? new Date()
    };
  }

  return {
    completedAt: null
  };
}
