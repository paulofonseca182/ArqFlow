import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import {
  cancelPayment,
  cancelExpense,
  createExpense,
  createManualCashMovement,
  createPayment,
  deleteExpense,
  generateProjectInstallments,
  getCashFlow,
  getCashSummary,
  getFinancialMeta,
  getFinancialSummary,
  listCashAccounts,
  listCashMovements,
  listExpenses,
  listFinancialCategories,
  listPayments,
  payExpense,
  reorganizeExpenseInstallments,
  registerPayment,
  reorganizeProjectInstallments,
  updateExpense,
  updatePayment
} from "./financial.service.js";
import type {
  CashPeriodQuery,
  CreateExpenseInput,
  CreatePaymentInput,
  GenerateInstallmentsInput,
  ListCashMovementsQuery,
  ListExpensesQuery,
  ListFinancialCategoriesQuery,
  ManualCashMovementInput,
  PayExpenseInput,
  ListPaymentsQuery,
  ReorganizeExpenseInstallmentsInput,
  ReorganizeInstallmentsInput,
  RegisterPaymentInput,
  UpdateExpenseInput,
  UpdatePaymentInput
} from "./financial.schema.js";

export const getFinancialMetaController: RequestHandler = async (_request, response) => {
  response.json(ok(await getFinancialMeta()));
};

export const getFinancialSummaryController: RequestHandler = async (_request, response) => {
  const summary = await getFinancialSummary();

  response.json(ok(summary));
};

export const listPaymentsController: RequestHandler = async (request, response) => {
  const result = await listPayments(request.query as unknown as ListPaymentsQuery);

  response.json(result);
};

export const listFinancialCategoriesController: RequestHandler = async (request, response) => {
  const categories = await listFinancialCategories(request.query as unknown as ListFinancialCategoriesQuery);

  response.json(ok(categories));
};

export const listCashAccountsController: RequestHandler = async (_request, response) => {
  const accounts = await listCashAccounts();

  response.json(ok(accounts));
};

export const listExpensesController: RequestHandler = async (request, response) => {
  const result = await listExpenses(request.query as unknown as ListExpensesQuery);

  response.json(result);
};

export const createExpenseController: RequestHandler = async (request, response) => {
  const expense = await createExpense(request.body as CreateExpenseInput);

  response.status(201).json(ok(expense));
};

export const updateExpenseController: RequestHandler = async (request, response) => {
  const expense = await updateExpense(request.params.id, request.body as UpdateExpenseInput);

  response.json(ok(expense));
};

export const payExpenseController: RequestHandler = async (request, response) => {
  const result = await payExpense(request.params.id, request.body as PayExpenseInput);

  response.json(ok(result));
};

export const cancelExpenseController: RequestHandler = async (request, response) => {
  const expense = await cancelExpense(request.params.id);

  response.json(ok(expense));
};

export const deleteExpenseController: RequestHandler = async (request, response) => {
  const result = await deleteExpense(request.params.id);

  response.json(ok(result));
};

export const reorganizeExpenseInstallmentsController: RequestHandler = async (request, response) => {
  const expense = await reorganizeExpenseInstallments(request.params.id, request.body as ReorganizeExpenseInstallmentsInput);

  response.json(ok(expense));
};

export const listCashMovementsController: RequestHandler = async (request, response) => {
  const result = await listCashMovements(request.query as unknown as ListCashMovementsQuery);

  response.json(result);
};

export const createManualCashMovementController: RequestHandler = async (request, response) => {
  const result = await createManualCashMovement(request.body as ManualCashMovementInput);

  response.status(201).json(ok(result));
};

export const getCashSummaryController: RequestHandler = async (request, response) => {
  const summary = await getCashSummary(request.query as unknown as CashPeriodQuery);

  response.json(ok(summary));
};

export const getCashFlowController: RequestHandler = async (request, response) => {
  const cashFlow = await getCashFlow(request.query as unknown as CashPeriodQuery);

  response.json(ok(cashFlow));
};

export const createPaymentController: RequestHandler = async (request, response) => {
  const result = await createPayment(request.body as CreatePaymentInput);

  response.status(201).json(ok(result));
};

export const updatePaymentController: RequestHandler = async (request, response) => {
  const result = await updatePayment(request.params.id, request.body as UpdatePaymentInput);

  response.json(ok(result));
};

export const registerPaymentController: RequestHandler = async (request, response) => {
  const result = await registerPayment(request.params.id, request.body as RegisterPaymentInput);

  response.json(ok(result));
};

export const cancelPaymentController: RequestHandler = async (request, response) => {
  const payment = await cancelPayment(request.params.id);

  response.json(ok(payment));
};

export const generateInstallmentsController: RequestHandler = async (request, response) => {
  const result = await generateProjectInstallments(request.body as GenerateInstallmentsInput);

  response.status(201).json(ok(result));
};

export const reorganizeInstallmentsController: RequestHandler = async (request, response) => {
  const result = await reorganizeProjectInstallments(request.params.projectId, request.body as ReorganizeInstallmentsInput);

  response.json(ok(result));
};
