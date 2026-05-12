import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import {
  createClient,
  deleteClient,
  getClientById,
  getClientDeleteImpact,
  getClientsMeta,
  listClients,
  updateClient
} from "./clients.service.js";
import type { CreateClientInput, ListClientsQuery, UpdateClientInput } from "./clients.schema.js";

export const getClientsMetaController: RequestHandler = (_request, response) => {
  response.json(ok(getClientsMeta()));
};

export const listClientsController: RequestHandler = async (request, response) => {
  const result = await listClients(request.query as unknown as ListClientsQuery);

  response.json(result);
};

export const getClientByIdController: RequestHandler = async (request, response) => {
  const client = await getClientById(request.params.id);

  response.json(ok(client));
};

export const createClientController: RequestHandler = async (request, response) => {
  const client = await createClient(request.body as CreateClientInput);

  response.status(201).json(ok(client));
};

export const updateClientController: RequestHandler = async (request, response) => {
  const client = await updateClient(request.params.id, request.body as UpdateClientInput);

  response.json(ok(client));
};

export const deleteClientController: RequestHandler = async (request, response) => {
  const result = await deleteClient(request.params.id);

  response.json(ok(result));
};

export const getClientDeleteImpactController: RequestHandler = async (request, response) => {
  const impact = await getClientDeleteImpact(request.params.id);

  response.json(ok(impact));
};
