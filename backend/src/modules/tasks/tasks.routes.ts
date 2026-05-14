import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  cancelTaskController,
  completeTaskController,
  createTaskController,
  deleteTaskController,
  getTaskByIdController,
  getTasksMetaController,
  listTasksController,
  reopenTaskController,
  updateTaskController
} from "./tasks.controller.js";
import { createTaskSchema, listTasksQuerySchema, taskIdParamsSchema, updateTaskSchema } from "./tasks.schema.js";

export const tasksRouter = Router();

tasksRouter.get("/meta", getTasksMetaController);
tasksRouter.get("/", validateRequest({ query: listTasksQuerySchema }), asyncHandler(listTasksController));
tasksRouter.post("/", validateRequest({ body: createTaskSchema }), asyncHandler(createTaskController));
tasksRouter.get("/:id", validateRequest({ params: taskIdParamsSchema }), asyncHandler(getTaskByIdController));
tasksRouter.patch(
  "/:id",
  validateRequest({ params: taskIdParamsSchema, body: updateTaskSchema }),
  asyncHandler(updateTaskController)
);
tasksRouter.patch("/:id/complete", validateRequest({ params: taskIdParamsSchema }), asyncHandler(completeTaskController));
tasksRouter.patch("/:id/reopen", validateRequest({ params: taskIdParamsSchema }), asyncHandler(reopenTaskController));
tasksRouter.patch("/:id/cancel", validateRequest({ params: taskIdParamsSchema }), asyncHandler(cancelTaskController));
tasksRouter.delete("/:id", validateRequest({ params: taskIdParamsSchema }), asyncHandler(deleteTaskController));
