import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import {
  completeProjectStep,
  generateDefaultProjectSteps,
  getProjectStepsMeta,
  listProjectSteps,
  reopenProjectStep,
  updateProjectStep
} from "./projectSteps.service.js";
import type { GenerateDefaultProjectStepsInput, ListProjectStepsQuery, UpdateProjectStepInput } from "./projectSteps.schema.js";

export const getProjectStepsMetaController: RequestHandler = (_request, response) => {
  response.json(ok(getProjectStepsMeta()));
};

export const listProjectStepsController: RequestHandler = async (request, response) => {
  const query = request.query as unknown as ListProjectStepsQuery;
  const result = await listProjectSteps(query.projectId);

  response.json(result);
};

export const generateDefaultProjectStepsController: RequestHandler = async (request, response) => {
  const input = request.body as GenerateDefaultProjectStepsInput;
  const result = await generateDefaultProjectSteps(input.projectId);

  response.status(201).json(ok(result));
};

export const updateProjectStepController: RequestHandler = async (request, response) => {
  const step = await updateProjectStep(request.params.id, request.body as UpdateProjectStepInput);

  response.json(ok(step));
};

export const completeProjectStepController: RequestHandler = async (request, response) => {
  const step = await completeProjectStep(request.params.id);

  response.json(ok(step));
};

export const reopenProjectStepController: RequestHandler = async (request, response) => {
  const step = await reopenProjectStep(request.params.id);

  response.json(ok(step));
};
