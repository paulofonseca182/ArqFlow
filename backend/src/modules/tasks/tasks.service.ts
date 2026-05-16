import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { taskPriorities, taskPriorityLabels, taskStatusLabels, taskStatuses } from "../../shared/domain.js";
import { AppError } from "../../shared/errors.js";
import { getPaginationMeta } from "../../shared/pagination.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./tasks.schema.js";

const taskSelect = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  assignee: true,
  dueDate: true,
  priority: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      client: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} satisfies Prisma.TaskSelect;

type TaskRecord = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;

export function getTasksMeta() {
  return {
    statuses: taskStatuses.map((value) => ({
      value,
      label: taskStatusLabels[value]
    })),
    priorities: taskPriorities.map((value) => ({
      value,
      label: taskPriorityLabels[value]
    }))
  };
}

export async function listTasks(query: ListTasksQuery) {
  const { page, pageSize } = query;
  const where = buildTaskWhere(query);

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      select: taskSelect,
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }, { title: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.task.count({ where })
  ]);

  return {
    data: tasks.map(mapTask),
    meta: getPaginationMeta(page, pageSize, total)
  };
}

export async function getTaskById(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    select: taskSelect
  });

  if (!task) {
    throw new AppError("TASK_NOT_FOUND", "Tarefa não encontrada.", 404);
  }

  return mapTask(task);
}

export async function createTask(input: CreateTaskInput) {
  await ensureProjectExists(input.projectId ?? null);

  const task = await prisma.task.create({
    data: input,
    select: taskSelect
  });

  return mapTask(task);
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const currentTask = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      projectId: true
    }
  });

  if (!currentTask) {
    throw new AppError("TASK_NOT_FOUND", "Tarefa não encontrada.", 404);
  }

  if ("projectId" in input) {
    await ensureProjectExists(input.projectId ?? null);
  }

  const task = await prisma.task.update({
    where: { id },
    data: input,
    select: taskSelect
  });

  return mapTask(task);
}

export async function completeTask(id: string) {
  await ensureTaskExists(id);

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: "COMPLETED"
    },
    select: taskSelect
  });

  return mapTask(task);
}

export async function reopenTask(id: string) {
  await ensureTaskExists(id);

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: "PENDING"
    },
    select: taskSelect
  });

  return mapTask(task);
}

export async function cancelTask(id: string) {
  await ensureTaskExists(id);

  const task = await prisma.task.update({
    where: { id },
    data: {
      status: "CANCELLED"
    },
    select: taskSelect
  });

  return mapTask(task);
}

export async function deleteTask(id: string) {
  await ensureTaskExists(id);
  await prisma.task.delete({ where: { id } });

  return { deleted: true };
}

export function buildTaskWhere(
  {
    dueFrom,
    dueTo,
    overdue,
    priority,
    projectId,
    search,
    scope,
    status
  }: Partial<Pick<ListTasksQuery, "dueFrom" | "dueTo" | "overdue" | "priority" | "projectId" | "scope" | "search" | "status">>,
  today = new Date()
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};
  const deadlineFilters: Prisma.DateTimeFilter[] = [];
  const usesOpenTaskScope = Boolean(overdue || scope === "OVERDUE_TASKS" || scope === "DUE_SOON_TASKS");

  if (projectId) {
    where.projectId = projectId;
  }

  if (status) {
    where.status = status;
  }

  if (usesOpenTaskScope && !status) {
    where.status = {
      notIn: ["COMPLETED", "CANCELLED"]
    };
  }

  if (usesOpenTaskScope && status) {
    where.AND = [
      {
        status: {
          notIn: ["COMPLETED", "CANCELLED"]
        }
      }
    ];
  }

  if (priority) {
    where.priority = priority;
  }

  if (overdue || scope === "OVERDUE_TASKS") {
    deadlineFilters.push({
      lt: startOfDay(today)
    });
  }

  if (scope === "DUE_SOON_TASKS") {
    deadlineFilters.push({
      gte: startOfDay(today),
      lte: endOfDay(addDays(startOfDay(today), 7))
    });
  }

  if (dueFrom || dueTo) {
    deadlineFilters.push({
      ...(dueFrom ? { gte: startOfDay(dueFrom) } : {}),
      ...(dueTo ? { lte: endOfDay(dueTo) } : {})
    });
  }

  if (deadlineFilters.length === 1) {
    where.dueDate = deadlineFilters[0];
  } else if (deadlineFilters.length > 1) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      ...deadlineFilters.map((dueDate) => ({ dueDate }))
    ];
  } else if (dueFrom || dueTo) {
    where.dueDate = {
      ...(dueFrom ? { gte: startOfDay(dueFrom) } : {}),
      ...(dueTo ? { lte: endOfDay(dueTo) } : {})
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { assignee: { contains: search } },
      { notes: { contains: search } },
      { project: { name: { contains: search } } },
      { project: { client: { name: { contains: search } } } }
    ];
  }

  return where;
}

export function isTaskOverdue(task: { dueDate?: Date | null; status: string }, today = new Date()) {
  if (!task.dueDate || ["COMPLETED", "CANCELLED"].includes(task.status)) {
    return false;
  }

  return startOfDay(task.dueDate) < startOfDay(today);
}

function mapTask(task: TaskRecord) {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    assignee: task.assignee,
    dueDate: task.dueDate?.toISOString() ?? null,
    priority: task.priority,
    status: task.status,
    notes: task.notes,
    isOverdue: isTaskOverdue(task),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    project: task.project
  };
}

async function ensureTaskExists(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!task) {
    throw new AppError("TASK_NOT_FOUND", "Tarefa não encontrada.", 404);
  }
}

async function ensureProjectExists(projectId?: string | null) {
  if (!projectId) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true }
  });

  if (!project) {
    throw new AppError("PROJECT_NOT_FOUND", "Projeto não encontrado.", 404);
  }
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
