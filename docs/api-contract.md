# Contrato Inicial da API

## Padrao de resposta

```ts
type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

## Padrao de paginacao

Listagens devem aceitar:

- `page`
- `pageSize`
- `search`
- filtros especificos do modulo

E devem retornar:

```ts
type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
```

## Modulos previstos

- `/clients`
- `/projects`
- `/projects/:projectId/steps`
- `/steps/:stepId`
- `/budgets`
- `/payments`
- `/tasks`
- `/visits`
- `/reports`
- `/dashboard`
