import { z } from "zod";

export const reportPeriodValues = ["CURRENT_MONTH", "CURRENT_YEAR", "CUSTOM"] as const;

const optionalDate = z.preprocess(parseOptionalDate, z.date().optional());

export const reportsOverviewQuerySchema = z
  .object({
    period: z.enum(reportPeriodValues).default("CURRENT_MONTH"),
    from: optionalDate,
    to: optionalDate
  })
  .superRefine(validateCustomPeriod);

export type ReportsOverviewQuery = z.infer<typeof reportsOverviewQuerySchema>;
export type ReportPeriodKey = (typeof reportPeriodValues)[number];

function validateCustomPeriod(data: { period: ReportPeriodKey; from?: Date; to?: Date }, context: z.RefinementCtx) {
  if (data.period === "CUSTOM" && (!data.from || !data.to)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["from"],
      message: "período personalizado exige data inicial e final"
    });
  }

  if (data.from && data.to && data.to < data.from) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["to"],
      message: "data final não pode ser anterior à data inicial"
    });
  }
}

function parseOptionalDate(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }

  return value;
}
