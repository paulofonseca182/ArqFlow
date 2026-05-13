import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import {
  createBudget,
  deleteBudget,
  getBudgetById,
  getBudgetsMeta,
  listBudgets,
  sendBudget,
  updateBudget
} from "./budgets.service.js";
import type { CreateBudgetInput, ListBudgetsQuery, UpdateBudgetInput } from "./budgets.schema.js";

export const getBudgetsMetaController: RequestHandler = (_request, response) => {
  response.json(ok(getBudgetsMeta()));
};

export const listBudgetsController: RequestHandler = async (request, response) => {
  const result = await listBudgets(request.query as unknown as ListBudgetsQuery);

  response.json(result);
};

export const getBudgetByIdController: RequestHandler = async (request, response) => {
  const budget = await getBudgetById(request.params.id);

  response.json(ok(budget));
};

export const createBudgetController: RequestHandler = async (request, response) => {
  const budget = await createBudget(request.body as CreateBudgetInput);

  response.status(201).json(ok(budget));
};

export const updateBudgetController: RequestHandler = async (request, response) => {
  const budget = await updateBudget(request.params.id, request.body as UpdateBudgetInput);

  response.json(ok(budget));
};

export const sendBudgetController: RequestHandler = async (request, response) => {
  const budget = await sendBudget(request.params.id);

  response.json(ok(budget));
};

export const deleteBudgetController: RequestHandler = async (request, response) => {
  const result = await deleteBudget(request.params.id);

  response.json(ok(result));
};
