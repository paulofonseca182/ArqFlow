import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import {
  cancelPayment,
  createPayment,
  generateProjectInstallments,
  getFinancialMeta,
  getFinancialSummary,
  listPayments,
  registerPayment,
  updatePayment
} from "./financial.service.js";
import type {
  CreatePaymentInput,
  GenerateInstallmentsInput,
  ListPaymentsQuery,
  RegisterPaymentInput,
  UpdatePaymentInput
} from "./financial.schema.js";

export const getFinancialMetaController: RequestHandler = (_request, response) => {
  response.json(ok(getFinancialMeta()));
};

export const getFinancialSummaryController: RequestHandler = async (_request, response) => {
  const summary = await getFinancialSummary();

  response.json(ok(summary));
};

export const listPaymentsController: RequestHandler = async (request, response) => {
  const result = await listPayments(request.query as unknown as ListPaymentsQuery);

  response.json(result);
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
