import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  cancelVisitController,
  completeVisitController,
  createVisitController,
  deleteVisitController,
  getVisitByIdController,
  getVisitsMetaController,
  listVisitsController,
  reopenVisitController,
  updateVisitController
} from "./visits.controller.js";
import { createVisitSchema, listVisitsQuerySchema, updateVisitSchema, visitIdParamsSchema } from "./visits.schema.js";

export const visitsRouter = Router();

visitsRouter.get("/meta", getVisitsMetaController);
visitsRouter.get("/", validateRequest({ query: listVisitsQuerySchema }), asyncHandler(listVisitsController));
visitsRouter.post("/", validateRequest({ body: createVisitSchema }), asyncHandler(createVisitController));
visitsRouter.get("/:id", validateRequest({ params: visitIdParamsSchema }), asyncHandler(getVisitByIdController));
visitsRouter.patch(
  "/:id",
  validateRequest({ params: visitIdParamsSchema, body: updateVisitSchema }),
  asyncHandler(updateVisitController)
);
visitsRouter.patch("/:id/complete", validateRequest({ params: visitIdParamsSchema }), asyncHandler(completeVisitController));
visitsRouter.patch("/:id/reopen", validateRequest({ params: visitIdParamsSchema }), asyncHandler(reopenVisitController));
visitsRouter.patch("/:id/cancel", validateRequest({ params: visitIdParamsSchema }), asyncHandler(cancelVisitController));
visitsRouter.delete("/:id", validateRequest({ params: visitIdParamsSchema }), asyncHandler(deleteVisitController));
