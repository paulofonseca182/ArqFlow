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
- `/budgets?scope=OPEN_BUDGETS&createdFrom=YYYY-MM-DD&createdTo=YYYY-MM-DD`
- `/payments`
- `/tasks`
- `/tasks?overdue=true`
- `/tasks?scope=OVERDUE_TASKS|DUE_SOON_TASKS&dueFrom=YYYY-MM-DD&dueTo=YYYY-MM-DD`
- `/visits`
- `/visits?scope=UPCOMING_VISITS&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`
- `/reports/overview?period=CURRENT_MONTH|CURRENT_YEAR|CUSTOM&from=YYYY-MM-DD&to=YYYY-MM-DD&clientId=:clientId&projectId=:projectId`
- `/dashboard`
