import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  completeProjectStepController,
  generateDefaultProjectStepsController,
  getProjectStepsMetaController,
  listProjectStepsController,
  reopenProjectStepController,
  updateProjectStepController
} from "./projectSteps.controller.js";
import {
  generateDefaultProjectStepsSchema,
  listProjectStepsQuerySchema,
  projectStepIdParamsSchema,
  updateProjectStepSchema
} from "./projectSteps.schema.js";

export const projectStepsRouter = Router();

projectStepsRouter.get("/meta", getProjectStepsMetaController);
projectStepsRouter.get("/", validateRequest({ query: listProjectStepsQuerySchema }), asyncHandler(listProjectStepsController));
projectStepsRouter.post(
  "/generate-defaults",
  validateRequest({ body: generateDefaultProjectStepsSchema }),
  asyncHandler(generateDefaultProjectStepsController)
);
projectStepsRouter.patch(
  "/:id",
  validateRequest({ params: projectStepIdParamsSchema, body: updateProjectStepSchema }),
  asyncHandler(updateProjectStepController)
);
projectStepsRouter.patch(
  "/:id/complete",
  validateRequest({ params: projectStepIdParamsSchema }),
  asyncHandler(completeProjectStepController)
);
projectStepsRouter.patch(
  "/:id/reopen",
  validateRequest({ params: projectStepIdParamsSchema }),
  asyncHandler(reopenProjectStepController)
);
