import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import { getDashboardSummary } from "./dashboard.service.js";

export const getDashboardController: RequestHandler = async (_request, response) => {
  const summary = await getDashboardSummary();

  response.json(ok(summary));
};
