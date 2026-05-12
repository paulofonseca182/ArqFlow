import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import { getClientsMeta } from "./clients.service.js";

export const getClientsMetaController: RequestHandler = (_request, response) => {
  response.json(ok(getClientsMeta()));
};
