import { describe, expect, it } from "vitest";
import { visitFormSchema } from "./visit-form";

const baseVisit = {
  address: "",
  amount: "",
  clientId: "client-1",
  date: "2026-06-23",
  notes: "",
  projectId: "",
  status: "SCHEDULED" as const,
  time: "",
  type: "TECHNICAL_VISIT" as const
};

describe("visit form", () => {
  it("exige projeto quando a visita tem valor", () => {
    const result = visitFormSchema.safeParse({
      ...baseVisit,
      amount: "250,00"
    });

    expect(result.success).toBe(false);
    expect(result.success ? null : result.error.issues[0]).toMatchObject({
      message: "Selecione um projeto para visitas com valor.",
      path: ["projectId"]
    });
  });

  it("permite visita com valor quando ha projeto", () => {
    const result = visitFormSchema.safeParse({
      ...baseVisit,
      amount: "250,00",
      projectId: "project-1"
    });

    expect(result.success).toBe(true);
  });
});
