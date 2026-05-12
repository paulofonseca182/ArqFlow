import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  createProjectController,
  deleteProjectController,
  getProjectByIdController,
  getProjectDeleteImpactController,
  getProjectsMetaController,
  listProjectsController,
  updateProjectController
} from "./projects.controller.js";
import { createProjectSchema, listProjectsQuerySchema, projectIdParamsSchema, updateProjectSchema } from "./projects.schema.js";

export const projectsRouter = Router();

projectsRouter.get("/meta", getProjectsMetaController);
projectsRouter.get("/", validateRequest({ query: listProjectsQuerySchema }), asyncHandler(listProjectsController));
projectsRouter.post("/", validateRequest({ body: createProjectSchema }), asyncHandler(createProjectController));
projectsRouter.get("/:id", validateRequest({ params: projectIdParamsSchema }), asyncHandler(getProjectByIdController));
projectsRouter.get(
  "/:id/delete-impact",
  validateRequest({ params: projectIdParamsSchema }),
  asyncHandler(getProjectDeleteImpactController)
);
projectsRouter.patch(
  "/:id",
  validateRequest({ params: projectIdParamsSchema, body: updateProjectSchema }),
  asyncHandler(updateProjectController)
);
projectsRouter.delete("/:id", validateRequest({ params: projectIdParamsSchema }), asyncHandler(deleteProjectController));
