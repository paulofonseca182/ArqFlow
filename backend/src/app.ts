import cors from "cors";
import express from "express";
import { errorMiddleware, notFoundMiddleware } from "./shared/errors.js";
import { budgetsRouter } from "./modules/budgets/budgets.routes.js";
import { clientsRouter } from "./modules/clients/clients.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { projectStepsRouter } from "./modules/projectSteps/projectSteps.routes.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/budgets", budgetsRouter);
  app.use("/clients", clientsRouter);
  app.use("/projects", projectsRouter);
  app.use("/project-steps", projectStepsRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
