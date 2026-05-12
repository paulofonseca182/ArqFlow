import { Router } from "express";
import { ok } from "../../shared/http.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json(ok({ status: "ok" }));
});
