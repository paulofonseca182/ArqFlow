import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  cancelPaymentController,
  createPaymentController,
  generateInstallmentsController,
  getFinancialMetaController,
  getFinancialSummaryController,
  listPaymentsController,
  registerPaymentController,
  updatePaymentController
} from "./financial.controller.js";
import {
  createPaymentSchema,
  generateInstallmentsSchema,
  listPaymentsQuerySchema,
  paymentIdParamsSchema,
  registerPaymentSchema,
  updatePaymentSchema
} from "./financial.schema.js";

export const financialRouter = Router();

financialRouter.get("/meta", getFinancialMetaController);
financialRouter.get("/summary", asyncHandler(getFinancialSummaryController));
financialRouter.get("/payments", validateRequest({ query: listPaymentsQuerySchema }), asyncHandler(listPaymentsController));
financialRouter.post("/payments", validateRequest({ body: createPaymentSchema }), asyncHandler(createPaymentController));
financialRouter.patch(
  "/payments/:id",
  validateRequest({ params: paymentIdParamsSchema, body: updatePaymentSchema }),
  asyncHandler(updatePaymentController)
);
financialRouter.patch(
  "/payments/:id/pay",
  validateRequest({ params: paymentIdParamsSchema, body: registerPaymentSchema }),
  asyncHandler(registerPaymentController)
);
financialRouter.patch(
  "/payments/:id/cancel",
  validateRequest({ params: paymentIdParamsSchema }),
  asyncHandler(cancelPaymentController)
);
financialRouter.post(
  "/installments",
  validateRequest({ body: generateInstallmentsSchema }),
  asyncHandler(generateInstallmentsController)
);
