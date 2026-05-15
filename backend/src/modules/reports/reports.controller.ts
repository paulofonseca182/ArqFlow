import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import { getReportsOverview } from "./reports.service.js";

export const getReportsOverviewController: RequestHandler = async (_request, response) => {
  const overview = await getReportsOverview();

  response.json(ok(overview));
};
