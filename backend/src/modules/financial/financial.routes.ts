import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  cancelExpenseController,
  cancelPaymentController,
  createExpenseController,
  createManualCashMovementController,
  createPaymentController,
  deleteExpenseController,
  generateInstallmentsController,
  getCashFlowController,
  getCashSummaryController,
  getFinancialMetaController,
  getFinancialSummaryController,
  listCashAccountsController,
  listCashMovementsController,
  listExpensesController,
  listFinancialCategoriesController,
  listPaymentsController,
  payExpenseController,
  registerPaymentController,
  reorganizeExpenseInstallmentsController,
  reorganizeInstallmentsController,
  updateExpenseController,
  updatePaymentController
} from "./financial.controller.js";
import {
  cashPeriodQuerySchema,
  createExpenseSchema,
  createPaymentSchema,
  expenseIdParamsSchema,
  generateInstallmentsSchema,
  listCashMovementsQuerySchema,
  listExpensesQuerySchema,
  listFinancialCategoriesQuerySchema,
  listPaymentsQuerySchema,
  manualCashMovementSchema,
  payExpenseSchema,
  paymentIdParamsSchema,
  projectInstallmentsParamsSchema,
  registerPaymentSchema,
  reorganizeExpenseInstallmentsSchema,
  reorganizeInstallmentsSchema,
  updateExpenseSchema,
  updatePaymentSchema
} from "./financial.schema.js";

export const financialRouter = Router();

financialRouter.get("/meta", asyncHandler(getFinancialMetaController));
financialRouter.get("/summary", asyncHandler(getFinancialSummaryController));
financialRouter.get(
  "/categories",
  validateRequest({ query: listFinancialCategoriesQuerySchema }),
  asyncHandler(listFinancialCategoriesController)
);
financialRouter.get("/cash-accounts", asyncHandler(listCashAccountsController));
financialRouter.get("/receivables", validateRequest({ query: listPaymentsQuerySchema }), asyncHandler(listPaymentsController));
financialRouter.patch(
  "/receivables/:id/pay",
  validateRequest({ params: paymentIdParamsSchema, body: registerPaymentSchema }),
  asyncHandler(registerPaymentController)
);
financialRouter.patch(
  "/receivables/:id/cancel",
  validateRequest({ params: paymentIdParamsSchema }),
  asyncHandler(cancelPaymentController)
);
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
financialRouter.patch(
  "/projects/:projectId/installments",
  validateRequest({ params: projectInstallmentsParamsSchema, body: reorganizeInstallmentsSchema }),
  asyncHandler(reorganizeInstallmentsController)
);
financialRouter.get("/expenses", validateRequest({ query: listExpensesQuerySchema }), asyncHandler(listExpensesController));
financialRouter.post("/expenses", validateRequest({ body: createExpenseSchema }), asyncHandler(createExpenseController));
financialRouter.patch(
  "/expenses/:id",
  validateRequest({ params: expenseIdParamsSchema, body: updateExpenseSchema }),
  asyncHandler(updateExpenseController)
);
financialRouter.patch(
  "/expenses/:id/pay",
  validateRequest({ params: expenseIdParamsSchema, body: payExpenseSchema }),
  asyncHandler(payExpenseController)
);
financialRouter.patch(
  "/expenses/:id/installments",
  validateRequest({ params: expenseIdParamsSchema, body: reorganizeExpenseInstallmentsSchema }),
  asyncHandler(reorganizeExpenseInstallmentsController)
);
financialRouter.patch(
  "/expenses/:id/cancel",
  validateRequest({ params: expenseIdParamsSchema }),
  asyncHandler(cancelExpenseController)
);
financialRouter.delete(
  "/expenses/:id",
  validateRequest({ params: expenseIdParamsSchema }),
  asyncHandler(deleteExpenseController)
);
financialRouter.get(
  "/cash-movements",
  validateRequest({ query: listCashMovementsQuerySchema }),
  asyncHandler(listCashMovementsController)
);
financialRouter.post(
  "/cash-movements/manual",
  validateRequest({ body: manualCashMovementSchema }),
  asyncHandler(createManualCashMovementController)
);
financialRouter.get("/cash-summary", validateRequest({ query: cashPeriodQuerySchema }), asyncHandler(getCashSummaryController));
financialRouter.get("/cash-flow", validateRequest({ query: cashPeriodQuerySchema }), asyncHandler(getCashFlowController));
