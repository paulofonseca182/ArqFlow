import { Router } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import { getDashboardController } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", asyncHandler(getDashboardController));
