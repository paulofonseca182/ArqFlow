import { describe, expect, it } from "vitest";
import { AppError } from "../../shared/errors.js";
import {
  assertStepDates,
  calculateStepsProgress,
  getDefaultStepsForType,
  getProjectStepsMeta
} from "./projectSteps.service.js";

describe("project steps service", () => {
  it("retorna metadados de status e templates", () => {
    const meta = getProjectStepsMeta();

    expect(meta.statuses).toContainEqual({
      value: "COMPLETED",
      label: "Concluída"
    });
    expect(meta.templates.some((template) => template.type === "INTERIORS")).toBe(true);
  });

  it("mantém templates padrão por tipo de projeto", () => {
    const interiorsSteps = getDefaultStepsForType("INTERIORS");

    expect(interiorsSteps.map((step) => step.name)).toEqual([
      "Alinhamento inicial",
      "Levantamento",
      "Anteprojeto",
      "Projeto 3D",
      "Projeto executivo",
      "Entrega final"
    ]);
  });

  it("mantém a sequência padrão enxuta em todos os tipos", () => {
    const meta = getProjectStepsMeta();

    for (const template of meta.templates) {
      expect(template.steps.map((step) => step.name)).toEqual([
        "Alinhamento inicial",
        "Levantamento",
        "Anteprojeto",
        "Projeto 3D",
        "Projeto executivo",
        "Entrega final"
      ]);
      expect(template.steps).not.toContainEqual(expect.objectContaining({ name: "Projeto legal" }));
    }
  });

  it("calcula progresso por etapas concluídas", () => {
    expect(calculateStepsProgress([])).toBe(0);
    expect(calculateStepsProgress([{ status: "PENDING" }, { status: "IN_PROGRESS" }])).toBe(0);
    expect(calculateStepsProgress([{ status: "COMPLETED" }, { status: "PENDING" }])).toBe(50);
    expect(calculateStepsProgress([{ status: "COMPLETED" }, { status: "COMPLETED" }])).toBe(100);
  });

  it("bloqueia datas de etapa anteriores ao inicio do projeto", () => {
    const projectStartsAt = new Date("2026-08-10T00:00:00.000Z");

    expect(() => assertStepDates(projectStartsAt, new Date("2026-08-01T00:00:00.000Z"), null)).toThrow(AppError);
    expect(() => assertStepDates(projectStartsAt, null, new Date("2026-08-01T00:00:00.000Z"))).toThrow(AppError);
  });

  it("bloqueia data prevista anterior ao inicio da etapa", () => {
    expect(() =>
      assertStepDates(null, new Date("2026-08-10T00:00:00.000Z"), new Date("2026-08-01T00:00:00.000Z"))
    ).toThrow(AppError);
  });
});
