import cors from "cors";
import express from "express";
import { errorMiddleware, notFoundMiddleware } from "./shared/errors.js";
import { clientsRouter } from "./modules/clients/clients.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/clients", clientsRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
