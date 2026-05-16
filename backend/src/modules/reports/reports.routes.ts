import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { getReportsOverviewController } from "./reports.controller.js";
import { reportsOverviewQuerySchema } from "./reports.schema.js";

export const reportsRouter = Router();

reportsRouter.get("/overview", validateRequest({ query: reportsOverviewQuerySchema }), asyncHandler(getReportsOverviewController));
