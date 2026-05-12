import { Router } from "express";
import { ok } from "../../shared/http.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", (_request, response) => {
  response.json(
    ok({
      clients: 0,
      projects: 0,
      overduePayments: 0,
      dueSoonPayments: 0
    })
  );
});
