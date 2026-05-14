import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import {
  cancelVisit,
  completeVisit,
  createVisit,
  deleteVisit,
  getVisitById,
  getVisitsMeta,
  listVisits,
  reopenVisit,
  updateVisit
} from "./visits.service.js";
import type { CreateVisitInput, ListVisitsQuery, UpdateVisitInput } from "./visits.schema.js";

export const getVisitsMetaController: RequestHandler = (_request, response) => {
  response.json(ok(getVisitsMeta()));
};

export const listVisitsController: RequestHandler = async (request, response) => {
  const result = await listVisits(request.query as unknown as ListVisitsQuery);

  response.json(result);
};

export const getVisitByIdController: RequestHandler = async (request, response) => {
  const visit = await getVisitById(request.params.id);

  response.json(ok(visit));
};

export const createVisitController: RequestHandler = async (request, response) => {
  const visit = await createVisit(request.body as CreateVisitInput);

  response.status(201).json(ok(visit));
};

export const updateVisitController: RequestHandler = async (request, response) => {
  const visit = await updateVisit(request.params.id, request.body as UpdateVisitInput);

  response.json(ok(visit));
};

export const completeVisitController: RequestHandler = async (request, response) => {
  const visit = await completeVisit(request.params.id);

  response.json(ok(visit));
};

export const reopenVisitController: RequestHandler = async (request, response) => {
  const visit = await reopenVisit(request.params.id);

  response.json(ok(visit));
};

export const cancelVisitController: RequestHandler = async (request, response) => {
  const visit = await cancelVisit(request.params.id);

  response.json(ok(visit));
};

export const deleteVisitController: RequestHandler = async (request, response) => {
  const result = await deleteVisit(request.params.id);

  response.json(ok(result));
};
