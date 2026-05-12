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

## Clientes

- `GET /clients`
  - Lista clientes com `page`, `pageSize`, `search` e `status`.
  - Busca por nome, e-mail, telefone e WhatsApp.
- `GET /clients/:id`
  - Retorna dados do cliente, projetos vinculados e contadores de impacto.
- `GET /clients/:id/delete-impact`
  - Retorna se o cliente existe e quantos registros vinculados impedem exclusao.
- `POST /clients`
  - Cria cliente com validacao Zod.
  - Exige nome e telefone ou WhatsApp.
  - Valida e-mail e CPF/CNPJ quando preenchidos.
- `PATCH /clients/:id`
  - Atualiza cliente parcialmente.
  - Nao permite deixar o cliente sem telefone e sem WhatsApp.
- `DELETE /clients/:id`
  - Exclui apenas clientes sem vinculos.
  - Retorna `CLIENT_HAS_RELATIONS` com detalhes de impacto quando houver registros vinculados.

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
