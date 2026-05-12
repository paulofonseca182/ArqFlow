import type { RequestHandler } from "express";
import type { AnyZodObject, ZodTypeAny } from "zod";

type RequestSchemas = {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
};

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (request, _response, next) => {
    if (schemas.body) {
      request.body = schemas.body.parse(request.body);
    }

    if (schemas.params) {
      request.params = schemas.params.parse(request.params) as Record<string, string>;
    }

    if (schemas.query) {
      request.query = schemas.query.parse(request.query) as Record<string, string>;
    }

    next();
  };
}

export function parseWith<T extends ZodTypeAny>(schema: T, value: unknown) {
  return schema.parse(value);
}
