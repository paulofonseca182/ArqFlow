import { describe, expect, it } from "vitest";
import {
  generateDefaultProjectStepsSchema,
  listProjectStepsQuerySchema,
  updateProjectStepSchema
} from "./projectSteps.schema.js";

const validProjectId = "clw0000000000000000000000";

describe("project steps schema", () => {
  it("exige projeto valido para listar e gerar etapas", () => {
    expect(listProjectStepsQuerySchema.safeParse({ projectId: validProjectId }).success).toBe(true);
    expect(generateDefaultProjectStepsSchema.safeParse({ projectId: validProjectId }).success).toBe(true);
    expect(listProjectStepsQuerySchema.safeParse({ projectId: "projeto" }).success).toBe(false);
  });

  it("exige pelo menos um campo no update", () => {
    expect(updateProjectStepSchema.safeParse({}).success).toBe(false);
    expect(updateProjectStepSchema.safeParse({ name: "Briefing" }).success).toBe(true);
  });

  it("aceita somente status oficiais", () => {
    expect(updateProjectStepSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
    expect(updateProjectStepSchema.safeParse({ status: "DONE" }).success).toBe(false);
  });

  it("bloqueia data prevista anterior ao inicio da etapa", () => {
    const result = updateProjectStepSchema.safeParse({
      startsAt: "2026-08-10",
      dueDate: "2026-08-01"
    });

    expect(result.success).toBe(false);
  });

  it("normaliza campos opcionais vazios", () => {
    const result = updateProjectStepSchema.parse({
      description: "",
      notes: "",
      dueDate: ""
    });

    expect(result.description).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.dueDate).toBeUndefined();
  });
});
