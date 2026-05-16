import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import type { ReportsOverviewQuery } from "./reports.schema.js";
import { getReportsOverview } from "./reports.service.js";

export const getReportsOverviewController: RequestHandler = async (request, response) => {
  const overview = await getReportsOverview(request.query as unknown as ReportsOverviewQuery);

  response.json(ok(overview));
};
