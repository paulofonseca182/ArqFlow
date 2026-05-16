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
- `GET /reports/overview`
- `GET /clients/meta`
- `GET /projects/meta`

## Dashboard

- `GET /dashboard`
  - Retorna resumo real de clientes, projetos, financeiro, tarefas, visitas, orçamentos e alertas operacionais.
  - Indicadores financeiros e atrasos são calculados no backend.

## Relatórios

- `GET /reports/overview`
  - Retorna visão consolidada de clientes, comercial, projetos, financeiro, tarefas e visitas.
  - Inclui conversão de orçamentos, progresso médio, recebíveis por projeto e distribuição por status/tipo/prioridade.
  - Aceita `period=CURRENT_MONTH|CURRENT_YEAR|CUSTOM`.
  - Quando `period=CUSTOM`, exige `from` e `to` em `YYYY-MM-DD`.
  - Receita usa `paidAt`; recebíveis e atrasos usam `dueDate`; tarefas usam `dueDate`; visitas usam `date`.

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

## Projetos

- `GET /projects/meta`
  - Retorna status e tipos oficiais de projeto.
- `GET /projects`
  - Lista projetos com `page`, `pageSize`, `search`, `status`, `type` e `clientId`.
  - Busca por nome do projeto, descricao, endereco da obra e nome do cliente.
- `GET /projects/:id`
  - Retorna dados do projeto com resumo do cliente, contadores de impacto e progresso.
- `GET /projects/:id/delete-impact`
  - Retorna se o projeto existe e quantos registros vinculados impedem exclusao.
- `POST /projects`
  - Cria projeto com validacao Zod.
  - Exige `clientId`, nome e tipo.
  - Valida cliente existente.
  - Bloqueia data de entrega anterior a data de inicio.
  - Bloqueia valores `area` e `contractedAmount` menores ou iguais a zero.
- `PATCH /projects/:id`
  - Atualiza projeto parcialmente.
  - Mantem cliente obrigatorio e valida datas considerando os dados atuais.
- `DELETE /projects/:id`
  - Exclui apenas projetos sem vinculos.
  - Retorna `PROJECT_HAS_RELATIONS` com detalhes de impacto quando houver registros vinculados.

## Orçamentos

- `GET /budgets`
  - Lista orçamentos com `page`, `pageSize`, `search`, `status`, `clientId`, `projectId`, `scope`, `createdFrom` e `createdTo`.
  - `scope=OPEN_BUDGETS` filtra orçamentos em `DRAFT`, `SENT` ou `NEGOTIATION`.
  - `createdFrom` e `createdTo` restringem o período de criação quando informados.

## Tarefas

- `GET /tasks/meta`
  - Retorna status e prioridades oficiais de tarefas.
- `GET /tasks`
  - Lista tarefas com `page`, `pageSize`, `search`, `status`, `priority`, `projectId`, `dueFrom`, `dueTo`, `overdue` e `scope`.
  - `overdue=true` filtra tarefas com `dueDate` menor que hoje e status diferente de `COMPLETED` ou `CANCELLED`.
  - `scope=OVERDUE_TASKS` aplica a mesma regra de atraso como contrato explícito para relatórios.
  - `scope=DUE_SOON_TASKS` filtra tarefas abertas com `dueDate` de hoje até os próximos 7 dias.
  - Busca por titulo, descricao, responsavel, notas, projeto e cliente do projeto.
- `POST /tasks`
  - Cria tarefa com projeto opcional.
  - Quando `projectId` for informado, valida se o projeto existe.
- `PATCH /tasks/:id`
  - Atualiza tarefa parcialmente.
- `PATCH /tasks/:id/complete`
  - Marca tarefa como concluida.
- `PATCH /tasks/:id/reopen`
  - Reabre tarefa como pendente.
- `PATCH /tasks/:id/cancel`
  - Cancela tarefa aberta.
- `DELETE /tasks/:id`
  - Remove tarefa com confirmacao visual no frontend.

## Visitas

- `GET /visits`
  - Lista visitas com `page`, `pageSize`, `search`, `clientId`, `projectId`, `type`, `status`, `dateFrom`, `dateTo` e `scope`.
  - `scope=UPCOMING_VISITS` filtra visitas `SCHEDULED` de hoje até os próximos 7 dias.
  - `dateFrom` e `dateTo` podem restringir o período retornado.

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
