import { describe, expect, it } from "vitest";
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "./tasks.schema.js";

describe("tasks schema", () => {
  it("valida criação de tarefa com projeto opcional", () => {
    const parsed = createTaskSchema.parse({
      projectId: "",
      title: "Revisar layout",
      priority: "HIGH",
      dueDate: "2026-06-10"
    });

    expect(parsed.projectId).toBeNull();
    expect(parsed.status).toBe("PENDING");
  });

  it("bloqueia título inválido e prioridade fora do domínio", () => {
    expect(
      createTaskSchema.safeParse({
        title: "A",
        priority: "CRITICAL"
      }).success
    ).toBe(false);
  });

  it("valida filtros por vencimento", () => {
    expect(
      listTasksQuerySchema.safeParse({
        dueFrom: "2026-06-01",
        dueTo: "2026-06-30"
      }).success
    ).toBe(true);

    expect(
      listTasksQuerySchema.safeParse({
        dueFrom: "2026-06-30",
        dueTo: "2026-06-01"
      }).success
    ).toBe(false);
  });

  it("valida filtro derivado de tarefas atrasadas", () => {
    const parsed = listTasksQuerySchema.parse({
      overdue: "true"
    });

    expect(parsed.overdue).toBe(true);
    expect(listTasksQuerySchema.parse({ overdue: "false" }).overdue).toBe(false);
    expect(listTasksQuerySchema.safeParse({ overdue: "sim" }).success).toBe(false);
  });

  it("valida escopos compostos de prazo", () => {
    expect(listTasksQuerySchema.parse({ scope: "DUE_SOON_TASKS" }).scope).toBe("DUE_SOON_TASKS");
    expect(listTasksQuerySchema.parse({ scope: "OVERDUE_TASKS" }).scope).toBe("OVERDUE_TASKS");
    expect(listTasksQuerySchema.safeParse({ scope: "DUE_SOON" }).success).toBe(false);
  });

  it("exige ao menos um campo no update", () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
    expect(updateTaskSchema.safeParse({ status: "IN_PROGRESS" }).success).toBe(true);
  });
});
