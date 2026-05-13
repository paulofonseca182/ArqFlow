import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  approveBudgetController,
  createBudgetController,
  deleteBudgetController,
  getBudgetByIdController,
  getBudgetsMetaController,
  listBudgetsController,
  sendBudgetController,
  updateBudgetController
} from "./budgets.controller.js";
import {
  approveBudgetSchema,
  budgetIdParamsSchema,
  createBudgetSchema,
  listBudgetsQuerySchema,
  updateBudgetSchema
} from "./budgets.schema.js";

export const budgetsRouter = Router();

budgetsRouter.get("/meta", getBudgetsMetaController);
budgetsRouter.get("/", validateRequest({ query: listBudgetsQuerySchema }), asyncHandler(listBudgetsController));
budgetsRouter.post("/", validateRequest({ body: createBudgetSchema }), asyncHandler(createBudgetController));
budgetsRouter.get("/:id", validateRequest({ params: budgetIdParamsSchema }), asyncHandler(getBudgetByIdController));
budgetsRouter.patch(
  "/:id",
  validateRequest({ params: budgetIdParamsSchema, body: updateBudgetSchema }),
  asyncHandler(updateBudgetController)
);
budgetsRouter.patch("/:id/send", validateRequest({ params: budgetIdParamsSchema }), asyncHandler(sendBudgetController));
budgetsRouter.patch(
  "/:id/approve",
  validateRequest({ params: budgetIdParamsSchema, body: approveBudgetSchema }),
  asyncHandler(approveBudgetController)
);
budgetsRouter.delete("/:id", validateRequest({ params: budgetIdParamsSchema }), asyncHandler(deleteBudgetController));
