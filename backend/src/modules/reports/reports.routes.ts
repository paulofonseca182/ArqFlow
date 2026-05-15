import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import { getReportsOverviewController } from "./reports.controller.js";

export const reportsRouter = Router();

reportsRouter.get("/overview", asyncHandler(getReportsOverviewController));
