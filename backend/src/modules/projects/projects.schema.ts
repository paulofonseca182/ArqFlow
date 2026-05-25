import { z } from "zod";
import { manualProjectReasons, projectOrigins, projectStatuses, projectTypes } from "../../shared/domain.js";
import { paginationQuerySchema } from "../../shared/pagination.js";

const manualProjectOrigins = ["LEGACY", "INTERNAL"] as const;
const optionalText = z.string().trim().min(1).optional().or(z.literal("").transform(() => undefined));
const optionalDate = z.coerce.date().optional().or(z.literal("").transform(() => undefined));
const optionalPositiveNumber = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === "string") {
      return Number(value.replace(",", "."));
    }

    return value;
  }, z.number().positive("valor deve ser maior que zero").optional());

export const projectIdParamsSchema = z.object({
  id: z.string().cuid()
});

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  clientId: z.string().cuid().optional(),
  origin: z.enum(projectOrigins).optional(),
  status: z.enum(projectStatuses).optional(),
  type: z.enum(projectTypes).optional()
});

const projectEditableSchema = z.object({
  clientId: z.string().cuid("cliente inválido"),
  name: z.string().trim().min(2, "nome deve ter pelo menos 2 caracteres"),
  type: z.enum(projectTypes),
  status: z.enum(projectStatuses),
  workAddress: optionalText,
  area: optionalPositiveNumber,
  contractedAmount: optionalPositiveNumber,
  startsAt: optionalDate,
  expectedDeliveryDate: optionalDate,
  description: optionalText,
  notes: optionalText,
  internalNotes: optionalText,
  pinned: z.boolean().optional()
});

export const createProjectSchema = projectEditableSchema
  .extend({
    origin: z.enum(manualProjectOrigins, {
      required_error: "selecione a origem do projeto manual"
    }),
    manualReason: z.enum(manualProjectReasons, {
      required_error: "projeto manual exige motivo"
    })
  })
  .superRefine((data, context) => {
    validateProjectDateRange(data, context);
    validateManualProjectOrigin(data, context);
  });

export const updateProjectSchema = projectEditableSchema
  .partial()
  .superRefine(validateProjectDateRange)
  .refine((data) => Object.keys(data).length > 0, {
    message: "informe pelo menos um campo para atualizar"
  });

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

function validateProjectDateRange(data: { startsAt?: Date; expectedDeliveryDate?: Date }, context: z.RefinementCtx) {
  if (data.startsAt && data.expectedDeliveryDate && data.expectedDeliveryDate < data.startsAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expectedDeliveryDate"],
      message: "data de entrega não pode ser anterior à data de início"
    });
  }
}

function validateManualProjectOrigin(
  data: {
    description?: string;
    manualReason?: string;
    notes?: string;
    origin?: string;
    startsAt?: Date;
  },
  context: z.RefinementCtx
) {
  if (data.origin === "BUDGET_APPROVAL") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["origin"],
      message: "projeto por orçamento aprovado deve ser gerado a partir do orçamento"
    });
  }

  if (data.origin === "LEGACY") {
    if (data.manualReason !== "LEGACY_PROJECT") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualReason"],
        message: "projeto legado exige motivo legado"
      });
    }

    if (!data.startsAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "projeto legado exige data de início original"
      });
    }

    if (!data.notes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notes"],
        message: "projeto legado exige justificativa"
      });
    }
  }

  if (data.origin === "INTERNAL") {
    if (data.manualReason !== "INTERNAL_PROJECT") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manualReason"],
        message: "projeto interno exige motivo interno"
      });
    }

    if (!data.description) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "projeto interno exige descrição ou motivo"
      });
    }
  }

  if (data.origin !== "BUDGET_APPROVAL" && !data.manualReason) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["manualReason"],
      message: "projeto manual exige motivo"
    });
  }
}
