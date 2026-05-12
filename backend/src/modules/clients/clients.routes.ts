import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.js";
import { asyncHandler } from "../../shared/async-handler.js";
import {
  createClientController,
  deleteClientController,
  getClientByIdController,
  getClientDeleteImpactController,
  getClientsMetaController,
  listClientsController,
  updateClientController
} from "./clients.controller.js";
import { clientIdParamsSchema, createClientSchema, listClientsQuerySchema, updateClientSchema } from "./clients.schema.js";

export const clientsRouter = Router();

clientsRouter.get("/meta", getClientsMetaController);
clientsRouter.get("/", validateRequest({ query: listClientsQuerySchema }), asyncHandler(listClientsController));
clientsRouter.post("/", validateRequest({ body: createClientSchema }), asyncHandler(createClientController));
clientsRouter.get("/:id", validateRequest({ params: clientIdParamsSchema }), asyncHandler(getClientByIdController));
clientsRouter.get(
  "/:id/delete-impact",
  validateRequest({ params: clientIdParamsSchema }),
  asyncHandler(getClientDeleteImpactController)
);
clientsRouter.patch(
  "/:id",
  validateRequest({ params: clientIdParamsSchema, body: updateClientSchema }),
  asyncHandler(updateClientController)
);
clientsRouter.delete("/:id", validateRequest({ params: clientIdParamsSchema }), asyncHandler(deleteClientController));
