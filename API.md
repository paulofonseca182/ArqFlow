# API

## Base Local

```txt
http://localhost:3333
```

## Resposta De Sucesso

```ts
type ApiSuccess<T> = {
  data: T;
  meta?: Record<string, unknown>;
};
```

## Resposta De Erro

```ts
type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

## Rotas Base

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
  - Inclui conversão comercial de orçamentos, progresso médio, recebíveis por projeto e distribuição por status, origem, tipo e prioridade.
  - Aceita `period=CURRENT_MONTH|CURRENT_YEAR|CUSTOM`.
  - Quando `period=CUSTOM`, exige `from` e `to` em `YYYY-MM-DD`.
  - Aceita `clientId` e `projectId` opcionais para escopar o relatório.
  - Quando `clientId` e `projectId` são enviados juntos, o projeto precisa pertencer ao cliente.
  - Retorna `filters` com cliente/projeto ativos para a UI e o CSV exibirem o escopo aplicado.
  - Receita usa `paidAt`; recebíveis e atrasos usam `dueDate`; tarefas usam `dueDate`; visitas usam `date`.
  - Projetos são separados por origem: orçamento aprovado, legado ou interno.

## Clientes

- `GET /clients`
  - Lista clientes com `page`, `pageSize`, `search` e `status`.
  - Busca por nome, e-mail, telefone e WhatsApp.
- `GET /clients/:id`
  - Retorna dados do cliente, projetos vinculados e contadores de impacto.
- `GET /clients/:id/delete-impact`
  - Retorna se o cliente existe e quantos registros vinculados impedem exclusão.
- `POST /clients`
  - Cria cliente com validação Zod.
  - Exige nome e telefone ou WhatsApp.
  - Valida e-mail e CPF/CNPJ quando preenchidos.
- `PATCH /clients/:id`
  - Atualiza cliente parcialmente.
  - Não permite deixar o cliente sem telefone e sem WhatsApp.
- `DELETE /clients/:id`
  - Exclui apenas clientes sem vínculos.
  - Retorna `CLIENT_HAS_RELATIONS` com detalhes de impacto quando houver registros vinculados.

## Projetos

- `GET /projects/meta`
  - Retorna status, tipos, origens e motivos manuais oficiais de projeto.
- `GET /projects`
  - Lista projetos com `page`, `pageSize`, `search`, `status`, `type`, `origin` e `clientId`.
  - Busca por nome do projeto, descrição, endereço da obra e nome do cliente.
- `GET /projects/:id`
  - Retorna dados do projeto com resumo do cliente, orçamento de origem, contadores de impacto e progresso.
- `GET /projects/:id/delete-impact`
  - Retorna se o projeto existe e quantos registros vinculados impedem exclusão.
- `POST /projects`
  - Cria projeto manual apenas como legado ou interno.
  - Aceita somente `origin=LEGACY` com `manualReason=LEGACY_PROJECT` ou `origin=INTERNAL` com `manualReason=INTERNAL_PROJECT`.
  - Projeto legado exige `clientId`, nome, tipo, status atual, data de início original (`startsAt`) e justificativa (`notes`).
  - Projeto interno exige `clientId`, nome, tipo, status atual e descrição/motivo (`description`).
  - Não aceita `origin=BUDGET_APPROVAL`; projetos comerciais novos por orçamento aprovado devem ser gerados por `/budgets/:id/generate-project`.
  - Valida cliente existente.
  - Bloqueia data de entrega anterior à data de início.
  - Bloqueia valores `area` e `contractedAmount` menores ou iguais a zero.
- `PATCH /projects/:id`
  - Atualiza projeto parcialmente.
  - Mantém cliente obrigatório e valida datas considerando os dados atuais.
- `DELETE /projects/:id`
  - Exclui apenas projetos sem vínculos.
  - Retorna `PROJECT_HAS_RELATIONS` com detalhes de impacto quando houver registros vinculados.

## Orçamentos

- `GET /budgets/meta`
  - Retorna status oficiais de orçamento.
- `GET /budgets`
  - Lista orçamentos com `page`, `pageSize`, `search`, `status`, `clientId`, `projectId`, `scope`, `createdFrom` e `createdTo`.
  - `scope=OPEN_BUDGETS` filtra orçamentos em `DRAFT`, `SENT` ou `NEGOTIATION`.
  - `projectId` considera tanto o vínculo operacional `projectId` quanto o projeto gerado em `convertedProjectId`.
  - `createdFrom` e `createdTo` restringem o período de criação quando informados.
- `GET /budgets/:id`
  - Retorna orçamento com cliente, projeto vinculado, projeto convertido e itens.
- `POST /budgets`
  - Cria orçamento com cliente obrigatório e pelo menos um item.
  - O backend calcula `totalAmount`, `finalAmount` e `BudgetItem.totalAmount`.
  - Não permite gravar `status=APPROVED`; a aprovação usa rota própria.
- `PATCH /budgets/:id`
  - Atualiza orçamento ainda não aprovado.
  - Bloqueia edição quando o orçamento está `APPROVED` ou já possui `convertedProjectId`.
  - Esse bloqueio protege itens, desconto e valores finais depois da aprovação.
- `PATCH /budgets/:id/send`
  - Envia orçamento em `DRAFT` ou `NEGOTIATION`, alterando status para `SENT`.
- `PATCH /budgets/:id/approve`
  - Aprova comercialmente um orçamento em `SENT` ou `NEGOTIATION`.
  - Exige pelo menos um item.
  - Registra `status=APPROVED` e `approvedAt`.
  - Não cria projeto.
- `PATCH /budgets/:id/generate-project`
  - Cria o projeto operacional a partir de um orçamento `APPROVED` ainda não convertido.
  - Usa `$transaction` para criar `Project` e atualizar `Budget`.
  - O projeto recebe `clientId`, `budgetId`, `origin=BUDGET_APPROVAL`, `approvedAt`, `convertedAt` e `contractedAmount` com base no `finalAmount` calculado no backend.
  - O orçamento recebe `projectId`, `convertedProjectId` e `convertedAt`.
  - Bloqueia duplicidade quando `projectId` ou `convertedProjectId` já existem.
- `DELETE /budgets/:id`
  - Exclui apenas orçamentos não aprovados.

## Financeiro

- `GET /financial/meta`
  - Retorna status e formas de pagamento oficiais.
- `GET /financial/summary`
  - Retorna indicadores financeiros reais calculados no backend.
- `GET /financial/payments`
  - Lista parcelas/pagamentos com filtros por status, projeto, cliente e vencimento.
- `POST /financial/payments`
  - Cria parcela manual vinculada a projeto.
- `PATCH /financial/payments/:id`
  - Atualiza dados operacionais da parcela.
- `PATCH /financial/payments/:id/pay`
  - Registra pagamento total ou parcial.
- `PATCH /financial/payments/:id/cancel`
  - Cancela parcela ainda não paga.
- `POST /financial/installments`
  - Gera parcelas a partir do valor contratado do projeto.

## Tarefas

- `GET /tasks/meta`
  - Retorna status e prioridades oficiais de tarefas.
- `GET /tasks`
  - Lista tarefas com `page`, `pageSize`, `search`, `clientId`, `status`, `priority`, `projectId`, `dueFrom`, `dueTo`, `overdue` e `scope`.
  - `clientId` filtra tarefas vinculadas a projetos do cliente; tarefas gerais sem projeto não entram nesse escopo.
  - `overdue=true` filtra tarefas com `dueDate` menor que hoje e status diferente de `COMPLETED` ou `CANCELLED`.
  - `scope=OVERDUE_TASKS` aplica a mesma regra de atraso como contrato explícito para relatórios.
  - `scope=DUE_SOON_TASKS` filtra tarefas abertas com `dueDate` de hoje até os próximos 7 dias.
  - Busca por título, descrição, responsável, notas, projeto e cliente do projeto.
- `POST /tasks`
  - Cria tarefa com projeto opcional.
  - Quando `projectId` for informado, valida se o projeto existe.
- `PATCH /tasks/:id`
  - Atualiza tarefa parcialmente.
- `PATCH /tasks/:id/complete`
  - Marca tarefa como concluída.
- `PATCH /tasks/:id/reopen`
  - Reabre tarefa como pendente.
- `PATCH /tasks/:id/cancel`
  - Cancela tarefa aberta.
- `DELETE /tasks/:id`
  - Remove tarefa com confirmação visual no frontend.

## Visitas

- `GET /visits/meta`
  - Retorna tipos e status oficiais de visitas.
- `GET /visits`
  - Lista visitas com `page`, `pageSize`, `search`, `clientId`, `projectId`, `type`, `status`, `dateFrom`, `dateTo` e `scope`.
  - `scope=UPCOMING_VISITS` filtra visitas `SCHEDULED` de hoje até os próximos 7 dias.
  - `dateFrom` e `dateTo` podem restringir o período retornado.
- `POST /visits`
  - Cria visita com cliente obrigatório e projeto opcional.
- `PATCH /visits/:id`
  - Atualiza visita parcialmente.
- `PATCH /visits/:id/complete`
  - Marca visita como concluída.
- `PATCH /visits/:id/reopen`
  - Reabre visita agendada.
- `PATCH /visits/:id/cancel`
  - Cancela visita.
- `DELETE /visits/:id`
  - Remove visita com confirmação visual no frontend.

## Padrão De Módulo Backend

```txt
backend/src/modules/[module]/
  [module].routes.ts
  [module].controller.ts
  [module].service.ts
  [module].schema.ts
```

## Paginação

Listagens devem aceitar:

- `page`
- `pageSize`
- `search`

E retornar `data` com `meta.page`, `meta.pageSize`, `meta.total` e `meta.totalPages`.
