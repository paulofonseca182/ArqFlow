import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export const notFoundMiddleware: RequestHandler = (request, _response, next) => {
  next(new AppError("NOT_FOUND", `Rota ${request.method} ${request.path} nao encontrada.`, 404));
};

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    return response.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados invalidos.",
        details: error.flatten()
      }
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return response.status(409).json({
        error: {
          code: "UNIQUE_CONSTRAINT",
          message: "Registro duplicado.",
          details: error.meta
        }
      });
    }

    if (error.code === "P2025") {
      return response.status(404).json({
        error: {
          code: "RECORD_NOT_FOUND",
          message: "Registro nao encontrado.",
          details: error.meta
        }
      });
    }

    if (error.code === "P2003") {
      return response.status(409).json({
        error: {
          code: "FOREIGN_KEY_CONSTRAINT",
          message: "Operacao bloqueada por registros vinculados.",
          details: error.meta
        }
      });
    }
  }

  console.error(error);

  return response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro interno do servidor."
    }
  });
};
