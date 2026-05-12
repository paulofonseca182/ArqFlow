import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjectDeleteImpact,
  getProjectsMeta,
  listProjects,
  updateProject
} from "./projects.service.js";
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from "./projects.schema.js";

export const getProjectsMetaController: RequestHandler = (_request, response) => {
  response.json(ok(getProjectsMeta()));
};

export const listProjectsController: RequestHandler = async (request, response) => {
  const result = await listProjects(request.query as unknown as ListProjectsQuery);

  response.json(result);
};

export const getProjectByIdController: RequestHandler = async (request, response) => {
  const project = await getProjectById(request.params.id);

  response.json(ok(project));
};

export const createProjectController: RequestHandler = async (request, response) => {
  const project = await createProject(request.body as CreateProjectInput);

  response.status(201).json(ok(project));
};

export const updateProjectController: RequestHandler = async (request, response) => {
  const project = await updateProject(request.params.id, request.body as UpdateProjectInput);

  response.json(ok(project));
};

export const deleteProjectController: RequestHandler = async (request, response) => {
  const result = await deleteProject(request.params.id);

  response.json(ok(result));
};

export const getProjectDeleteImpactController: RequestHandler = async (request, response) => {
  const impact = await getProjectDeleteImpact(request.params.id);

  response.json(ok(impact));
};
