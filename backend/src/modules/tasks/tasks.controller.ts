import type { RequestHandler } from "express";
import { ok } from "../../shared/http.js";
import {
  cancelTask,
  completeTask,
  createTask,
  deleteTask,
  getTaskById,
  getTasksMeta,
  listTasks,
  reopenTask,
  updateTask
} from "./tasks.service.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./tasks.schema.js";

export const getTasksMetaController: RequestHandler = (_request, response) => {
  response.json(ok(getTasksMeta()));
};

export const listTasksController: RequestHandler = async (request, response) => {
  const result = await listTasks(request.query as unknown as ListTasksQuery);

  response.json(result);
};

export const getTaskByIdController: RequestHandler = async (request, response) => {
  const task = await getTaskById(request.params.id);

  response.json(ok(task));
};

export const createTaskController: RequestHandler = async (request, response) => {
  const task = await createTask(request.body as CreateTaskInput);

  response.status(201).json(ok(task));
};

export const updateTaskController: RequestHandler = async (request, response) => {
  const task = await updateTask(request.params.id, request.body as UpdateTaskInput);

  response.json(ok(task));
};

export const completeTaskController: RequestHandler = async (request, response) => {
  const task = await completeTask(request.params.id);

  response.json(ok(task));
};

export const reopenTaskController: RequestHandler = async (request, response) => {
  const task = await reopenTask(request.params.id);

  response.json(ok(task));
};

export const cancelTaskController: RequestHandler = async (request, response) => {
  const task = await cancelTask(request.params.id);

  response.json(ok(task));
};

export const deleteTaskController: RequestHandler = async (request, response) => {
  const result = await deleteTask(request.params.id);

  response.json(ok(result));
};
