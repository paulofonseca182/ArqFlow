import { describe, expect, it } from "vitest";
import { buildTaskWhere, getTasksMeta, isTaskOverdue } from "./tasks.service.js";

describe("tasks service", () => {
  it("retorna metadados de status e prioridades", () => {
    const meta = getTasksMeta();

    expect(meta.statuses).toContainEqual({
      value: "PENDING",
      label: "Pendente"
    });
    expect(meta.priorities).toContainEqual({
      value: "URGENT",
      label: "Urgente"
    });
  });

  it("monta filtros por projeto, status, prioridade e prazo", () => {
    const dueFrom = new Date(2026, 5, 1);
    const dueTo = new Date(2026, 5, 30);

    expect(
      buildTaskWhere({
        dueFrom,
        dueTo,
        priority: "HIGH",
        projectId: "clw0000000000000000000000",
        status: "IN_PROGRESS"
      })
    ).toEqual({
      dueDate: {
        gte: new Date(2026, 5, 1),
        lte: new Date(2026, 5, 30, 23, 59, 59, 999)
      },
      priority: "HIGH",
      projectId: "clw0000000000000000000000",
      status: "IN_PROGRESS"
    });
  });

  it("monta busca por tarefa, responsável, projeto e cliente", () => {
    expect(buildTaskWhere({ search: "ana" })).toEqual({
      OR: [
        { title: { contains: "ana" } },
        { description: { contains: "ana" } },
        { assignee: { contains: "ana" } },
        { notes: { contains: "ana" } },
        { project: { name: { contains: "ana" } } },
        { project: { client: { name: { contains: "ana" } } } }
      ]
    });
  });

  it("monta filtro de tarefas atrasadas excluindo concluídas e canceladas", () => {
    expect(buildTaskWhere({ overdue: true }, new Date(2026, 4, 13))).toEqual({
      dueDate: {
        lt: new Date(2026, 4, 13)
      },
      status: {
        notIn: ["COMPLETED", "CANCELLED"]
      }
    });
  });

  it("monta escopo de tarefas vencendo em 7 dias", () => {
    expect(buildTaskWhere({ scope: "DUE_SOON_TASKS" }, new Date(2026, 4, 13))).toEqual({
      dueDate: {
        gte: new Date(2026, 4, 13),
        lte: new Date(2026, 4, 20, 23, 59, 59, 999)
      },
      status: {
        notIn: ["COMPLETED", "CANCELLED"]
      }
    });
  });

  it("combina escopo de tarefas vencendo em 7 dias com período informado", () => {
    expect(
      buildTaskWhere(
        {
          dueFrom: new Date(2026, 4, 15),
          dueTo: new Date(2026, 4, 31),
          scope: "DUE_SOON_TASKS"
        },
        new Date(2026, 4, 13)
      )
    ).toEqual({
      AND: [
        {
          dueDate: {
            gte: new Date(2026, 4, 13),
            lte: new Date(2026, 4, 20, 23, 59, 59, 999)
          }
        },
        {
          dueDate: {
            gte: new Date(2026, 4, 15),
            lte: new Date(2026, 4, 31, 23, 59, 59, 999)
          }
        }
      ],
      status: {
        notIn: ["COMPLETED", "CANCELLED"]
      }
    });
  });

  it("combina filtro de atraso com status solicitado", () => {
    expect(buildTaskWhere({ overdue: true, status: "IN_PROGRESS" }, new Date(2026, 4, 13))).toEqual({
      AND: [
        {
          status: {
            notIn: ["COMPLETED", "CANCELLED"]
          }
        }
      ],
      dueDate: {
        lt: new Date(2026, 4, 13)
      },
      status: "IN_PROGRESS"
    });
  });

  it("calcula atraso de tarefa dinamicamente", () => {
    expect(isTaskOverdue({ dueDate: new Date(2026, 4, 10), status: "PENDING" }, new Date(2026, 4, 13))).toBe(true);
    expect(isTaskOverdue({ dueDate: new Date(2026, 4, 13), status: "PENDING" }, new Date(2026, 4, 13))).toBe(false);
    expect(isTaskOverdue({ dueDate: new Date(2026, 4, 10), status: "COMPLETED" }, new Date(2026, 4, 13))).toBe(false);
    expect(isTaskOverdue({ status: "PENDING" }, new Date(2026, 4, 13))).toBe(false);
  });
});
