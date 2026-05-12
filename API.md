# API

## Base local

```txt
http://localhost:3333
```

## Resposta de sucesso

```ts
type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};
```

## Resposta de erro

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

## Rotas base

- `GET /health`
- `GET /dashboard`
- `GET /clients/meta`

## Padrao de modulo backend

```txt
backend/src/modules/[module]/
  [module].routes.ts
  [module].controller.ts
  [module].service.ts
  [module].schema.ts
```

## Paginacao

Listagens devem aceitar:

- `page`
- `pageSize`
- `search`

E retornar `data` com `meta.page`, `meta.pageSize`, `meta.total` e `meta.totalPages`.
