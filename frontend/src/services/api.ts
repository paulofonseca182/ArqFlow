import axios from "axios";

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code = "REQUEST_ERROR",
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333"
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data as ApiErrorPayload | undefined;
    const message = payload?.error?.message ?? "Não foi possível concluir a requisição.";
    const code = payload?.error?.code ?? "REQUEST_ERROR";

    return Promise.reject(new ApiError(message, code, status, payload?.error?.details));
  }
);
