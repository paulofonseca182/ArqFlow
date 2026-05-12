import { Router } from "express";
import { getClientsMetaController } from "./clients.controller.js";

export const clientsRouter = Router();

clientsRouter.get("/meta", getClientsMetaController);
