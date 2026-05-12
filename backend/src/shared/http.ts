export type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { data, ...(meta ? { meta } : {}) };
}
