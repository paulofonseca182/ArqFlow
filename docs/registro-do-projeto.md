# Registro do Projeto ArqFlow

Data de criação: 2026-05-12

Este documento registra o que foi feito até aqui no ArqFlow, as decisões técnicas tomadas, o estado atual do projeto e os próximos passos recomendados. A ideia é servir como ponto de consulta caso algo quebre, o contexto se perca ou seja necessário entender rapidamente por que a base foi montada dessa forma.

## Objetivo do projeto

O ArqFlow é um sistema local de gestão para escritórios de arquitetura.

O MVP deve centralizar:

- clientes;
- projetos;
- etapas;
- orçamentos;
- financeiro;
- tarefas;
- visitas técnicas;
- documentos;
- briefings;
- relatorios;
- dashboard operacional.

O modo inicial do sistema é local, rodando em `localhost`, com banco SQLite local. A evolucao futura pode incluir autenticação, permissões, backup, integrações e versão cloud.

## Fontes de referencia

As principais referencias usadas até aqui foram:

- PDF inicial do cronograma completo do ArqFlow.
- `AGENTS.md`, que define stack, regras, agentes, padroes de codigo e identidade visual.
- Decisões tomadas durante a Fase 0 e Fase 0.1.

O `AGENTS.md` é a referência principal para qualquer nova tarefa.

Antes de alterar codigo, sempre:

1. Ler `AGENTS.md`.
2. Entender o modulo afetado.
3. Verificar impacto em frontend, backend, banco e validacoes.
4. Fazer alteracoes pequenas, consistentes e testaveis.
5. Manter regras críticas no backend.
6. Manter TypeScript.
7. Preservar a UI dark premium do ArqFlow.

## Stack oficial

Frontend:

- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- React Router 6+
- React Hook Form 7+
- Zod 3+
- Axios 1+
- Vite 5+

Backend:

- Node.js 20+
- Express 4+
- Prisma ORM 5+
- SQLite 3+

Ferramentas:

- pnpm 8+ via Corepack
- Vitest 1+

## Fases concluídas

### Fase 0 - Fundação técnica

Foi criada a estrutura inicial do projeto:

- monorepo com `frontend/` e `backend/`;
- configuração de workspace com `pnpm-workspace.yaml`;
- scripts principais no `package.json` da raiz;
- configuracoes TypeScript no frontend e backend;
- estrutura inicial de backend Express;
- estrutura inicial de frontend React/Vite;
- schema Prisma inicial;
- seed inicial;
- documentação técnica base.

### Fase 0.1 - Alinhamento com AGENTS.md

A Fase 0.1 ajustou a base para ficar coerente com o `AGENTS.md`.

Foram feitos:

- alinhamento visual para dark premium;
- atualização da paleta premium com fundo grafite, bronze de destaque e azul técnico;
- criação de componentes UI obrigatórios;
- criação do padrão backend `routes/controller/service/schema`;
- centralização de contratos de domínio e status;
- criação de regras de negócio puras;
- criação de testes iniciais;
- correcao do drift do banco local;
- sincronização das migrations Prisma;
- regeneração do Prisma Client;
- documentação mínima de setup, API, banco, design system, regras e roadmap.

## Estrutura atual do projeto

Raiz:

```txt
AGENTS.md
API.md
BUSINESS_RULES.md
CHANGELOG.md
DATABASE.md
DESIGN_SYSTEM.md
README.md
ROADMAP.md
SETUP.md
USER_GUIDE.md
package.json
pnpm-workspace.yaml
```

Backend:

```txt
backend/
  package.json
  tsconfig.json
  prisma/
    schema.prisma
    seed.ts
    migrations/
  src/
    app.ts
    server.ts
    database/
    middleware/
    modules/
    shared/
```

Frontend:

```txt
frontend/
  package.json
  vite.config.ts
  tailwind.config.ts
  src/
    components/
      layout/
      ui/
    pages/
    services/
    router.tsx
    main.tsx
    styles.css
```

## Banco de dados

O banco local usa SQLite via Prisma.

Modelos criados:

- `Client`
- `Project`
- `ProjectStep`
- `Budget`
- `BudgetItem`
- `Payment`
- `Task`
- `Visit`
- `Document`
- `Briefing`
- `BriefingAnswer`

Migrations criadas:

- `20260511150000_init`
- `20260511162000_phase_0_1_alignment`
- `20260512100000_protect_payments_cascade_steps`

Decisões importantes:

- `Project` exige `clientId`.
- `Budget` exige `clientId` e pode ter `projectId` nulo.
- `Payment` exige `projectId` e `clientId`.
- `Task` pode existir sem projeto.
- `Visit` pode existir sem projeto, mas exige cliente.
- `Document` pode ter cliente e/ou projeto, mas não pode ficar sem dono.
- `Briefing` exige cliente e pode ter projeto nulo.
- `BudgetItem` pertence a `Budget`.
- `BriefingAnswer` pertence a `Briefing`.

Regras técnicas:

- `PRAGMA foreign_keys = ON` é ativado na inicialização do servidor e no seed.
- Status e tipos ficam como `String` no SQLite.
- Contratos de status/tipos ficam centralizados em `backend/src/shared/domain.ts`.
- `Payment -> Project` usa `Restrict`, para evitar apagar pagamentos automaticamente ao excluir projeto.
- `Document` possui proteção para não ficar sem `clientId` nem `projectId`.

Importante:

- `backend/prisma/dev.db` e banco local de desenvolvimento.
- O arquivo `.gitignore` deve impedir versionamento do banco local.
- Migrations devem ser versionadas.

## Backend

Base Express criada com:

- `backend/src/app.ts`;
- `backend/src/server.ts`;
- middleware de JSON;
- CORS;
- middleware de erro;
- rota `GET /health`;
- rota real `GET /dashboard`;
- rota inicial `GET /clients/meta`;
- modulo de Clientes em `/clients`;
- modulo inicial de Projetos em `/projects`;
- modulo de Etapas de Projeto em `/project-steps`.
- modulo inicial de Orçamentos em `/budgets`.
- modulo inicial de Financeiro em `/financial`.
- modulo de Dashboard real agregado em `/dashboard`.
- modulo inicial de Tarefas em `/tasks`.
- modulo inicial de Visitas Técnicas em `/visits`.

Arquivos compartilhados importantes:

- `backend/src/shared/http.ts`: contrato de resposta.
- `backend/src/shared/errors.ts`: erros da aplicação e tratamento de erros.
- `backend/src/shared/async-handler.ts`: wrapper para controllers async.
- `backend/src/shared/pagination.ts`: helper de paginação.
- `backend/src/shared/domain.ts`: status e tipos oficiais.
- `backend/src/shared/business-rules.ts`: regras puras testaveis.
- `backend/src/middleware/validateRequest.ts`: validação Zod de `body`, `params` e `query`.

Tratamento de erros:

- Zod retorna erro de validação.
- Prisma `P2002` retorna conflito de unicidade.
- Prisma `P2025` retorna registro não encontrado.
- Prisma `P2003` retorna bloqueio por chave estrangeira.
- Erros inesperados retornam erro interno.

## Modulo de Clientes - estado atual

O modulo de Clientes ja possui backend completo e frontend inicial conectado a API real.

Backend:

```txt
backend/src/modules/clients/
  clients.routes.ts
  clients.controller.ts
  clients.service.ts
  clients.schema.ts
  clients.schema.test.ts
```

Frontend:

```txt
frontend/src/pages/Clients/
  ClientsPage.tsx
  ClientFormModal.tsx
  client-form.ts

frontend/src/services/clients.ts
frontend/src/types/client.ts
frontend/src/types/api.ts
```

Implementado no backend:

- `GET /clients/meta`;
- `GET /clients`;
- `GET /clients/:id`;
- `GET /clients/:id/delete-impact`;
- `POST /clients`;
- `PATCH /clients/:id`;
- `DELETE /clients/:id`;
- busca por nome, e-mail, telefone e WhatsApp;
- paginação;
- filtro por status;
- exclusão protegida com contagem de vínculos;
- schemas Zod iniciais;
- testes de schema;
- testes de service;
- status de clientes centralizados;
- validação de e-mail;
- normalização de e-mail vazio;
- validação de CPF/CNPJ;
- exigência de telefone ou WhatsApp na criação.

Implementado no frontend:

- rota `/clients` substituiu o placeholder por uma tela real;
- service Axios para consumir `/clients`;
- tipos TypeScript para contratos de API, paginação, cliente, status e impacto de exclusão;
- listagem com busca por nome, e-mail, telefone ou WhatsApp;
- filtro por status consumindo `GET /clients/meta`;
- paginação simples usando `meta.page`, `meta.total` e `meta.totalPages`;
- formulário de criação e edição em modal;
- React Hook Form com validação Zod manual, sem dependência nova;
- validação de nome, e-mail, CPF/CNPJ, telefone e WhatsApp;
- normalização de telefone, WhatsApp e CPF/CNPJ para digitos antes de enviar;
- exclusão em duas etapas com `GET /clients/:id/delete-impact`;
- bloqueio visual quando houver projetos, orçamentos, pagamentos, visitas, documentos ou briefings vinculados;
- modal de confirmação quando a exclusão for permitida;
- estados de carregamento, vazio, erro e sucesso.

Ainda falta:

- testes de frontend para formulário, filtros e fluxo de exclusão;
- refinamento visual após uso real;
- mascaras visuais para telefone, WhatsApp e CPF/CNPJ;
- detalhe individual do cliente, se necessário na próxima fase.

## Modulo de Projetos - estado atual

O modulo de Projetos possui backend inicial e frontend inicial conectados a API real.

Banco:

- o modelo `Project` ja existia no Prisma;
- `clientId` e obrigatório;
- `Project -> Client` usa `onDelete: Restrict`;
- não foi necessário criar migration para esta primeira fatia.

Backend:

```txt
backend/src/modules/projects/
  projects.routes.ts
  projects.controller.ts
  projects.service.ts
  projects.schema.ts
  projects.schema.test.ts
  projects.service.test.ts
```

Frontend:

```txt
frontend/src/pages/Projects/
  ProjectsPage.tsx
  ProjectFormModal.tsx
  project-form.ts

frontend/src/services/projects.ts
frontend/src/types/project.ts
```

Implementado no backend:

- `GET /projects/meta`;
- `GET /projects`;
- `GET /projects/:id`;
- `GET /projects/:id/delete-impact`;
- `POST /projects`;
- `PATCH /projects/:id`;
- `DELETE /projects/:id`;
- busca por nome do projeto, descrição, endereço da obra e nome do cliente;
- filtros por status, tipo e cliente;
- paginação;
- validação Zod de `clientId`, nome, tipo, status, datas e valores positivos;
- status `Desenho 3D em desenvolvimento` disponível logo após `Aguardando aprovação do cliente`;
- verificação de cliente existente antes de criar ou trocar o cliente do projeto;
- bloqueio de data de entrega anterior a data de início;
- progresso calculado no backend a partir das etapas existentes;
- exclusão protegida com contagem de vínculos;
- testes de schema e service.

Implementado no frontend:

- rota `/projects` substituiu o placeholder por uma tela real;
- service Axios para consumir `/projects`;
- tipos TypeScript para Projeto, status, tipos e impacto de exclusão;
- listagem com busca, filtros por status, tipo e cliente;
- formulário de criação e edição em modal;
- select de cliente consumindo dados reais de `/clients`;
- React Hook Form com validação Zod manual, sem dependência nova;
- validação de cliente obrigatório, nome, tipo, status, datas e valores positivos;
- barra de progresso por projeto;
- exclusão em duas etapas com `GET /projects/:id/delete-impact`;
- bloqueio visual quando houver etapas, orçamentos, pagamentos, tarefas, visitas, documentos ou briefings vinculados;
- estados de carregamento, vazio, erro e sucesso.

Ainda falta:

- testes de frontend para formulário e filtros;
- tela de detalhe do projeto;
- integração futura com orçamentos, financeiro, tarefas, visitas e documentos.

## Modulo de Etapas de Projeto - estado atual

O modulo de Etapas de Projeto foi implementado como continuidade direta de Projetos.

Banco:

- o modelo `ProjectStep` ja existia no Prisma;
- cada etapa pertence obrigatoriamente a um `Project`;
- `ProjectStep -> Project` usa `onDelete: Cascade`;
- existe indice por `projectId` e `status`;
- existe unicidade por `projectId + sortOrder`;
- não foi necessário criar migration nesta fatia.

Backend:

```txt
backend/src/modules/projectSteps/
  projectSteps.routes.ts
  projectSteps.controller.ts
  projectSteps.service.ts
  projectSteps.schema.ts
  projectSteps.schema.test.ts
  projectSteps.service.test.ts
```

Frontend:

```txt
frontend/src/services/projectSteps.ts
frontend/src/types/projectStep.ts
frontend/src/pages/Projects/ProjectsPage.tsx
```

Implementado no backend:

- `GET /project-steps/meta`;
- `GET /project-steps?projectId=:projectId`;
- `POST /project-steps/generate-defaults`;
- `PATCH /project-steps/:id`;
- `PATCH /project-steps/:id/complete`;
- `PATCH /project-steps/:id/reopen`;
- metadados de status oficiais de etapas;
- templates de etapas padrão por tipo de projeto;
- template padrão enxuto: Briefing, Levantamento, Anteprojeto, Projeto 3D, Projeto executivo e Entrega final;
- geração de etapas com `sortOrder` sequencial;
- bloqueio de geração duplicada quando o projeto ja possui etapas;
- listagem ordenada por `sortOrder`;
- conclusão de etapa com `status = COMPLETED` e `completedAt` definido pelo backend;
- reabertura de etapa com `status = PENDING` e `completedAt = null`;
- validação para bloquear `startsAt` ou `dueDate` anteriores ao início do projeto;
- validação para bloquear `dueDate` anterior a `startsAt`;
- progresso calculado no backend por etapas concluídas sobre total.

Implementado no frontend:

- botao de etapas na tabela de Projetos;
- carregamento de metadados de etapas junto com os metadados de Projetos;
- service Axios para consumir `/project-steps`;
- tipos TypeScript para etapa, status e resposta de progresso;
- modal de etapas dentro da tela `/projects`;
- estado vazio com ação para gerar etapas padrão;
- lista de etapas com ordem, nome, status, datas e progresso real;
- ação para concluir etapa;
- ação para reabrir etapa concluída ou cancelada;
- recarregamento da lista de projetos após mutacoes para atualizar o progresso exibido.

Regras consideradas:

- etapa pertence a projeto;
- etapas padrão devem respeitar o tipo do projeto;
- geração padrão não deve duplicar etapas existentes;
- progresso real vem do backend;
- frontend não envia `completedAt`;
- backend decide a data de conclusão;
- reabrir etapa limpa `completedAt`;
- datas de etapa não podem quebrar a data de início do projeto;
- exclusão de projeto com etapas continua bloqueada pelo fluxo de Projetos.

Ainda falta:

- criação manual de etapa fora dos templates;
- edição visual de datas, status e notas da etapa;
- reordenação manual de etapas;
- testes de frontend do modal de etapas.

## Modulo de Orçamentos - estado atual

O modulo de Orçamentos possui backend inicial e frontend inicial conectados a API real.

Banco:

- os modelos `Budget` e `BudgetItem` ja existiam no Prisma;
- `Budget` exige `clientId` obrigatório;
- `Budget` pode ter `projectId` nulo;
- `BudgetItem` pertence obrigatoriamente a `Budget`;
- `BudgetItem -> Budget` usa `onDelete: Cascade`;
- não foi necessário criar migration nesta primeira fatia.

Backend:

```txt
backend/src/modules/budgets/
  budgets.routes.ts
  budgets.controller.ts
  budgets.service.ts
  budgets.schema.ts
  budgets.schema.test.ts
  budgets.service.test.ts
```

Frontend:

```txt
frontend/src/pages/Budgets/
  BudgetsPage.tsx
  BudgetFormModal.tsx
  budget-form.ts

frontend/src/services/budgets.ts
frontend/src/types/budget.ts
```

Implementado no backend:

- `GET /budgets/meta`;
- `GET /budgets`;
- `GET /budgets/:id`;
- `POST /budgets`;
- `PATCH /budgets/:id`;
- `PATCH /budgets/:id/send`;
- `PATCH /budgets/:id/approve`;
- `DELETE /budgets/:id`;
- busca por título, tipo de serviço, descrição, cliente, projeto e descrição dos itens;
- filtros por status, cliente e projeto;
- paginação;
- status oficiais de orçamento centralizados;
- validação Zod de cliente, título, tipo de serviço, status, desconto, validade e itens;
- validação de valores financeiros positivos;
- exigência de pelo menos 1 item;
- cálculo de `totalAmount`, `finalAmount` e `BudgetItem.totalAmount` no backend;
- transação para criar orçamento com itens;
- transação para substituir itens ao editar orçamento;
- bloqueio de envio quando o orçamento não está em rascunho ou negociação;
- aprovação/conversão de orçamento em projeto usando `$transaction`;
- criação de projeto com `contractedAmount` derivado de `Budget.finalAmount`;
- vinculação do orçamento aprovado ao projeto criado via `projectId`;
- bloqueio de exclusão de orçamento aprovado;
- testes de schema e service.

Implementado no frontend:

- rota `/budgets` substituiu o placeholder por uma tela real;
- service Axios para consumir `/budgets`;
- tipos TypeScript para Orçamento, Item, status e payload de escrita;
- listagem com busca, filtro por status e filtro por cliente;
- formulário de criação e edição em modal;
- select de cliente consumindo dados reais de `/clients`;
- React Hook Form com validação Zod manual;
- itens dinâmicos com adicionar/remover item;
- validação de cliente obrigatório, título, tipo de serviço, desconto, validade e itens;
- exibição de valores calculados pela API;
- ação para enviar orçamento;
- ação para aprovar orçamento e converter em projeto;
- modal de conversão com tipo, status inicial, datas, área, endereço e descrição do projeto;
- exclusão com modal de confirmação;
- estados de carregamento, vazio, erro e sucesso.

Regras consideradas:

- orçamento deve ter cliente;
- cliente deve existir no backend;
- projeto, quando vinculado no backend, deve pertencer ao mesmo cliente;
- orçamento deve ter pelo menos 1 item;
- quantidade e valor unitário devem ser maiores que zero;
- desconto não pode ser negativo;
- valor final é calculado no backend;
- frontend valida para UX, mas não substitui regras críticas;
- orçamento aprovado não pode ser excluído nesta fatia.
- orçamento convertido não pode gerar outro projeto.

Ainda falta:

- vincular orçamento a projeto pela interface;
- gerar parcelas a partir de orçamento aprovado;
- testes de frontend para formulário, filtros, envio e exclusão;
- refinamento de impressão/exportação de proposta.

## Modulo Financeiro e Parcelas - estado atual

O modulo Financeiro foi iniciado como continuidade do fluxo Orçamento aprovado -> Projeto -> Parcelas.

Banco:

- o modelo `Payment` ja existia no Prisma;
- cada parcela/pagamento exige `projectId` e `clientId`;
- `Payment -> Project` e `Payment -> Client` usam `onDelete: Restrict`;
- não foi necessário criar migration nesta fatia;
- o cliente da parcela e derivado do projeto no backend, evitando divergência enviada pelo frontend.

Backend:

```txt
backend/src/modules/financial/
  financial.routes.ts
  financial.controller.ts
  financial.service.ts
  financial.schema.ts
  financial.schema.test.ts
  financial.service.test.ts
```

Frontend:

```txt
frontend/src/pages/Financial/
  FinancialPage.tsx
  PaymentFormModal.tsx
  GenerateInstallmentsModal.tsx
  RegisterPaymentModal.tsx
  payment-form.ts

frontend/src/services/financial.ts
frontend/src/types/financial.ts
```

Implementado no backend:

- `GET /financial/meta`;
- `GET /financial/summary`;
- `GET /financial/payments`;
- `POST /financial/payments`;
- `PATCH /financial/payments/:id`;
- `PATCH /financial/payments/:id/pay`;
- `PATCH /financial/payments/:id/cancel`;
- `POST /financial/installments`;
- metadados de status e formas de pagamento;
- listagem paginada de parcelas com busca por descrição, projeto e cliente;
- filtros por status, projeto, cliente e vencimento;
- criação manual de parcela sempre vinculada a projeto;
- edição de dados operacionais da parcela;
- geração de parcelas a partir do `contractedAmount` do projeto;
- parcelamento limitado a à vista, 2x ou 3x;
- divisão do valor contratado sem perda de centavos;
- bloqueio de geração quando o projeto ja possui parcelas ativas;
- registro de pagamento total ou parcial;
- preenchimento automático de `paidAt` ao registrar pagamento;
- bloqueio de data de pagamento futura;
- bloqueio de valor pago maior que o valor da parcela;
- cancelamento de parcela ainda não paga;
- status atrasado calculado dinamicamente pelo backend;
- resumo financeiro com receita do mês, receita do ano, recebido, a receber, atrasado, vencendo em 7 dias, orçamentos aprovados/recusados e ticket médio;
- alerta quando a soma das parcelas ultrapassa o valor contratado do projeto;
- testes de schema e service para regras financeiras.

Implementado no frontend:

- rota `/financial` substituiu o placeholder por uma tela real;
- service Axios para consumir `/financial`;
- tipos TypeScript para parcela, status, formas de pagamento, resumo e alertas;
- cards de indicadores financeiros no topo da tela;
- listagem com busca e filtros por status, projeto e cliente;
- tabela de parcelas com projeto, cliente, valor, valor pago, vencimento, status, forma de pagamento e ações;
- modal para criação e edição de parcela;
- modal para gerar parcelas a partir de um projeto;
- modal para registrar pagamento total ou parcial;
- modal de cancelamento de parcela;
- React Hook Form com validação Zod manual;
- estados de carregamento, vazio, erro e sucesso;
- badges de status financeiros;
- tooltips nos botões de ação seguindo o padrão das outras telas.

Regras consideradas:

- pagamento deve estar vinculado a projeto;
- cliente da parcela vem do projeto no backend;
- valores financeiros devem ser maiores que zero;
- valor pago não pode ultrapassar o valor da parcela;
- data de pagamento não pode ser futura;
- pagamento atrasado e calculado dinamicamente;
- pagamento pago ou cancelado não entra como atrasado;
- ao registrar pagamento sem data, o backend preenche `paidAt`;
- pagamento parcial recebe status `PARTIALLY_PAID`;
- pagamento total recebe status `PAID`;
- parcelas canceladas deixam de alimentar indicadores de recebimento e atraso;
- geração padrão de parcelas usa o valor contratado do projeto convertido do orçamento;
- frontend valida para UX, mas backend continua sendo a fonte da verdade.

Ainda falta:

- testes de frontend para formulários e ações financeiras;
- refinamento visual contínuo após uso real;
- geração automática opcional de parcelas imediatamente após converter orçamento em projeto;
- relatório financeiro por projeto.

## Modulo Dashboard - estado atual

O Dashboard foi integrado aos dados reais do backend como visão agregada do escritório.

Backend:

```txt
backend/src/modules/dashboard/
  dashboard.routes.ts
  dashboard.controller.ts
  dashboard.service.ts
  dashboard.service.test.ts
```

Frontend:

```txt
frontend/src/pages/Dashboard/
  DashboardPage.tsx

frontend/src/services/dashboard.ts
frontend/src/types/dashboard.ts
```

Implementado no backend:

- `GET /dashboard`;
- agregação de clientes totais;
- contagem de projetos ativos;
- contagem de pagamentos atrasados;
- contagem de pagamentos vencendo em 7 dias;
- reaproveitamento de `getFinancialSummary()` do módulo Financeiro;
- cálculo de progresso médio com `calculateProjectProgress()`;
- próximas entregas a partir de projetos ativos com data futura;
- agrupamento de projetos por status oficial;
- alertas para pagamentos atrasados, vencimentos próximos, entregas próximas e parcelas acima do contratado;
- testes para progresso médio, próximas entregas e alertas.

Implementado no frontend:

- Dashboard inicial conectado a `GET /dashboard`;
- service Axios dedicado;
- tipos TypeScript para o contrato do Dashboard;
- cards reais de Clientes, Projetos ativos, Atrasados e Vencem em 7 dias;
- cards financeiros reais de Receita do mês, Receita do ano, A receber e Ticket por projeto;
- seção de Próximas entregas com progresso médio e progresso por projeto;
- seção de Alertas com badges por severidade;
- ação de atualização manual;
- estado de carregamento e erro.

Regras consideradas:

- Dashboard agrega dados; não decide regra financeira crítica no frontend;
- Financeiro continua sendo a fonte da verdade para recebido, a receber, vencido, vencendo e ticket médio;
- atraso continua dinâmico;
- progresso vem das etapas concluídas;
- projetos finalizados e cancelados não entram como ativos;
- alertas são calculados no backend.

Ainda falta:

- testes de frontend do Dashboard;
- gráficos futuros, caso façam sentido;
- atalhos de navegação dos alertas para os módulos relacionados.

## Modulo de Tarefas - estado atual

O módulo de Tarefas foi iniciado para organizar atividades operacionais do escritório, com vínculo opcional a projetos.

Banco:

- o modelo `Task` ja existia no Prisma;
- `projectId` e opcional;
- `Task -> Project` usa `onDelete: SetNull`;
- se um projeto for removido futuramente, a tarefa pode permanecer como tarefa geral;
- não foi necessário criar migration nesta fatia.

Backend:

```txt
backend/src/modules/tasks/
  tasks.routes.ts
  tasks.controller.ts
  tasks.service.ts
  tasks.schema.ts
  tasks.schema.test.ts
  tasks.service.test.ts
```

Frontend:

```txt
frontend/src/pages/Tasks/
  TasksPage.tsx
  TaskFormModal.tsx
  task-form.ts

frontend/src/services/tasks.ts
frontend/src/types/task.ts
```

Implementado no backend:

- `GET /tasks/meta`;
- `GET /tasks`;
- `GET /tasks/:id`;
- `POST /tasks`;
- `PATCH /tasks/:id`;
- `PATCH /tasks/:id/complete`;
- `PATCH /tasks/:id/reopen`;
- `PATCH /tasks/:id/cancel`;
- `DELETE /tasks/:id`;
- metadados de status e prioridades oficiais;
- listagem paginada;
- busca por título, descrição, responsável, notas, projeto e cliente do projeto;
- filtros por projeto, status, prioridade e intervalo de prazo;
- criação de tarefa com projeto opcional;
- validação de projeto existente quando `projectId` e informado;
- edição de tarefa;
- conclusão, reabertura e cancelamento por endpoints dedicados;
- exclusão de tarefa;
- atraso calculado dinamicamente pelo backend com `dueDate < hoje` e status diferente de concluída/cancelada;
- testes de schema e service.

Implementado no frontend:

- rota `/tasks` substituiu o placeholder por uma tela real;
- service Axios para consumir `/tasks`;
- tipos TypeScript para tarefa, status, prioridade e projeto resumido;
- tela com busca, filtros por status, prioridade e projeto;
- tabela com tarefa, projeto, responsável, prioridade, status, prazo e ações;
- badges por status, prioridade e atraso;
- modal de criação/edição com React Hook Form e Zod;
- ações rápidas para concluir, reabrir e cancelar;
- exclusão com modal de confirmação;
- estados de carregamento, vazio, erro e sucesso;
- tooltips nos botões de ação.

Regras consideradas:

- tarefa pode existir sem projeto;
- projeto vinculado, quando informado, precisa existir;
- título e obrigatório;
- status e prioridade devem respeitar o domínio oficial;
- prazo e opcional;
- atraso de tarefa e dinâmico;
- tarefa concluída ou cancelada não aparece como atrasada;
- frontend valida para UX, mas backend continua sendo a fonte da verdade.

Ainda falta:

- campo `completedAt`, caso seja necessário auditar a data de conclusão;
- testes de frontend para formulário, filtros e ações rápidas;
- integração futura de tarefas no Dashboard;
- detalhe de tarefa, caso o fluxo cresça;
- responsáveis cadastrados, caso surja um módulo de equipe.

## Modulo de Visitas Técnicas - estado atual

O modulo de Visitas Técnicas foi iniciado para registrar atendimentos presenciais, levantamentos, vistorias e visitas externas do escritório.

Banco:

- o modelo `Visit` ja existia no Prisma;
- `clientId` e obrigatório;
- `projectId` e opcional;
- `Visit -> Client` usa `onDelete: Restrict`;
- `Visit -> Project` usa `onDelete: SetNull`;
- existem índices por cliente, projeto, status e data;
- não foi necessário criar migration nesta fatia.

Backend:

```txt
backend/src/modules/visits/
  visits.routes.ts
  visits.controller.ts
  visits.service.ts
  visits.schema.ts
  visits.schema.test.ts
  visits.service.test.ts
```

Frontend:

```txt
frontend/src/pages/Visits/
  VisitsPage.tsx
  VisitFormModal.tsx
  visit-form.ts

frontend/src/services/visits.ts
frontend/src/types/visit.ts
```

Implementado no backend:

- `GET /visits/meta`;
- `GET /visits`;
- `GET /visits/:id`;
- `POST /visits`;
- `PATCH /visits/:id`;
- `PATCH /visits/:id/complete`;
- `PATCH /visits/:id/reopen`;
- `PATCH /visits/:id/cancel`;
- `DELETE /visits/:id`;
- metadados de status e tipos oficiais;
- listagem paginada;
- busca por tipo, endereço, observações, cliente e projeto;
- filtros por cliente, projeto, tipo, status e período;
- criação e edição de visita com cliente obrigatório e projeto opcional;
- validação de cliente existente;
- validação de projeto existente quando `projectId` e informado;
- validação de que o projeto pertence ao mesmo cliente da visita;
- validação de horário no formato `HH:mm`;
- validação de valor positivo quando informado;
- bloqueio para concluir visita cancelada;
- bloqueio para cancelar visita concluída;
- exclusão de visita;
- testes de schema e service.

Implementado no frontend:

- rota `/visits` substituiu o placeholder por uma tela real;
- service Axios para consumir `/visits`;
- tipos TypeScript para visita, status, tipo, cliente e projeto resumidos;
- tela com busca, filtros por status, tipo, cliente e projeto;
- tabela com visita, cliente, projeto, data/hora, valor, status e ações;
- badges por status;
- modal de criação/edição com React Hook Form e Zod;
- select de projeto filtrado pelo cliente selecionado;
- ações rápidas para concluir, reabrir e cancelar;
- exclusão com modal de confirmação;
- estados de carregamento, vazio, erro e sucesso;
- tooltips nos botões de ação.

Regras consideradas:

- visita deve ter cliente;
- projeto e opcional;
- projeto vinculado, quando informado, precisa existir;
- projeto vinculado precisa pertencer ao mesmo cliente da visita;
- data e obrigatória;
- horário e opcional, mas deve estar em `HH:mm` quando preenchido;
- valor e opcional, mas deve ser positivo quando informado;
- status e tipo devem respeitar o domínio oficial;
- frontend valida para UX, mas backend continua sendo a fonte da verdade.

Ainda falta:

- integração de visitas no Dashboard;
- testes de frontend para formulário, filtros e ações rápidas;
- recorrência de visitas, se esse fluxo surgir;
- vínculo futuro com documentos/fotos da visita.

## Ajuste de UI e português - Projetos e Clientes

Foi feito um passe de qualidade visual e textual nas telas operacionais já entregues.

Frontend:

- os botões das ações de tabela em Clientes e Projetos foram refinados para `h-6 w-6`, com ícones `h-4 w-4`, traço fino `1.75` e tooltip de ação ao passar o mouse;
- os ícones dos controles de busca, limpar filtros e atualizar lista em Clientes e Projetos foram padronizados com `h-4 w-4`, traço `1.75` e tooltip/descrição ao passar o mouse;
- o tamanho dos botões de ação foi preservado;
- cabeçalhos, mensagens vazias, avisos, modais e rótulos de formulário receberam acentuação correta;
- textos como `Ações`, `Endereço`, `Não`, `Próxima`, `Conclusão`, `Exclusão`, `vínculos` e `orçamentos` foram corrigidos nas telas visíveis.

Backend:

- mensagens de erro de Clientes, Projetos, Etapas, validações e tratamento global receberam acentuação correta;
- labels oficiais de etapas foram corrigidas para `Em revisão` e `Concluída`;
- mensagens que podem aparecer no frontend agora retornam português revisado pela API.

Documentação:

- `README.md` foi atualizado com o ajuste visual dos ícones e a revisão textual;
- este registro foi atualizado para documentar a mudança e facilitar auditoria futura.

## Frontend

O frontend foi estruturado com React, Vite, TypeScript e Tailwind.

Foi aplicada a identidade visual dark premium definida no `AGENTS.md` e refinada com a nova paleta premium do ArqFlow.

Paleta visual atual:

- fundo principal `#090B0D`;
- fundos de sidebar/cards `#15181C`;
- card elevado/modal `#171A1E`;
- bordas `#4A4340` e `#2D2B2B`;
- textos `#F3F3F3`, `#B1B2B3` e `#8A8B8D`;
- bronze `#B67E5D` e `#7A4E38` para marca, foco e detalhes;
- azul `#244B78` e `#558CCA` para ações principais e estados ativos.

Componentes de layout:

- `AppLayout`
- `Header`
- `MobileNav`
- `PageWrapper`
- `Sidebar`
- `navigation`

Componentes UI:

- `Badge`
- `Button`
- `Card`
- `DeleteModal`
- `EmptyState`
- `Input`
- `LoadingState`
- `Modal`
- `ProgressBar`
- `Select`
- `StatCard`
- `Table`
- `Textarea`

Rotas atuais:

- Dashboard, ja conectado a dados reais
- Clientes, ja conectada a tela real
- Projetos, ja conectada a tela real inicial
- Orçamentos, ja conectada a tela real inicial
- Financeiro, ja conectado a tela real inicial
- Tarefas, ja conectada a tela real inicial
- Visitas, ja conectada a tela real inicial
- Documentos
- Briefings
- Relatórios
- Configurações

Observação:

- As telas alem de Dashboard, Clientes, Projetos, Etapas de Projeto, Orçamentos, Financeiro, Tarefas e Visitas ainda sao placeholders.
- Clientes foi a primeira tela operacional do MVP.
- Projetos é a segunda fatia operacional e depende de Cliente como vínculo obrigatório.
- Etapas de Projeto é a terceira fatia operacional e alimenta o progresso real de Projetos.
- Orçamentos é a quarta fatia operacional e inicia o fluxo comercial/financeiro.
- Financeiro é a quinta fatia operacional e registra parcelas, pagamentos e indicadores.
- Dashboard agora consolida a visão real desses módulos.
- Tarefas é a sexta fatia operacional e organiza atividades com prazos, prioridades e status.
- Visitas Técnicas é a sétima fatia operacional e organiza visitas com cliente obrigatório e projeto opcional.

### Frontend - Clientes

Objetivo:

- permitir cadastrar, listar, buscar, filtrar, editar e excluir clientes com confirmação.

Usuário beneficiado:

- escritório de arquitetura que precisa organizar leads, clientes ativos, clientes recorrentes e contatos em fase de orçamento.

Fluxo implementado:

1. Usuário acessa `/clients`.
2. A tela carrega status via `/clients/meta`.
3. A tela lista clientes via `/clients`.
4. Usuário pode buscar por nome, e-mail, telefone ou WhatsApp.
5. Usuário pode filtrar por status.
6. Usuário pode abrir o modal de novo cliente.
7. Usuário pode editar um cliente existente.
8. Antes de excluir, a tela consulta `/clients/:id/delete-impact`.
9. Se houver vínculos, a exclusão e bloqueada visualmente.
10. Se não houver vínculos, a tela abre modal de confirmação e chama `DELETE /clients/:id`.

Campos principais do formulário:

- nome;
- status;
- telefone;
- WhatsApp;
- e-mail;
- CPF/CNPJ;
- cidade;
- UF;
- origem;
- endereço;
- observacoes.

Regras consideradas:

- cliente deve ter nome;
- cliente deve ter telefone ou WhatsApp;
- e-mail e opcional, mas deve ser valido quando preenchido;
- CPF/CNPJ e opcional, mas deve ser valido quando preenchido;
- frontend valida para UX;
- backend continua sendo a fonte da verdade;
- exclusão crítica exige confirmação;
- exclusão de cliente com vínculos deve ser bloqueada.

### Frontend - Projetos

Objetivo:

- permitir cadastrar, listar, buscar, filtrar, editar e excluir projetos com confirmação, sempre vinculados a um cliente existente.

Usuário beneficiado:

- escritório de arquitetura que precisa acompanhar projetos por cliente, tipo, status e prazo.

Fluxo implementado:

1. Usuário acessa `/projects`.
2. A tela carrega status e tipos via `/projects/meta`.
3. A tela carrega clientes via `/clients`.
4. A tela lista projetos via `/projects`.
5. Usuário pode buscar por projeto, cliente ou endereço.
6. Usuário pode filtrar por status, tipo e cliente.
7. Usuário pode abrir o modal de novo projeto.
8. Usuário seleciona um cliente obrigatório.
9. Usuário pode editar um projeto existente.
10. Antes de excluir, a tela consulta `/projects/:id/delete-impact`.
11. Se houver vínculos, a exclusão e bloqueada visualmente.
12. Se não houver vínculos, a tela abre modal de confirmação e chama `DELETE /projects/:id`.

Campos principais do formulário:

- cliente;
- nome do projeto;
- tipo;
- status;
- data de início;
- data prevista de entrega;
- valor contratado;
- area;
- endereço da obra;
- descrição;
- observacoes.

Regras consideradas:

- projeto deve ter cliente;
- cliente deve existir no backend;
- projeto deve ter nome;
- projeto deve ter tipo;
- data de entrega não pode ser anterior a data de início;
- valor contratado e area sao opcionais, mas se preenchidos devem ser maiores que zero;
- frontend valida para UX;
- backend continua sendo a fonte da verdade;
- exclusão crítica exige confirmação;
- exclusão de projeto com vínculos deve ser bloqueada.

### Frontend - Etapas de Projeto

Objetivo:

- permitir gerar etapas padrão por tipo de projeto, acompanhar status das etapas e alimentar o progresso real do projeto.

Usuário beneficiado:

- escritório de arquitetura que precisa transformar um projeto cadastrado em um roteiro operacional de trabalho.

Fluxo implementado:

1. Usuário acessa `/projects`.
2. Usuário clica no botao de etapas de um projeto.
3. A tela carrega etapas via `/project-steps?projectId=:projectId`.
4. Se o projeto não tiver etapas, o modal mostra ação para gerar etapas padrão.
5. A geração chama `POST /project-steps/generate-defaults`.
6. As etapas aparecem ordenadas por `sortOrder`.
7. Usuário pode concluir uma etapa.
8. A conclusão chama `PATCH /project-steps/:id/complete`.
9. Usuário pode reabrir uma etapa concluída ou cancelada.
10. A reabertura chama `PATCH /project-steps/:id/reopen`.
11. A lista de projetos e recarregada para refletir o progresso atualizado.

Campos exibidos:

- ordem;
- nome da etapa;
- status;
- data de início;
- prazo;
- data de conclusão;
- progresso real do projeto.

Regras consideradas:

- frontend não calcula progresso crítico;
- frontend não envia `completedAt`;
- backend e fonte da verdade para conclusão, reabertura e progresso;
- geração padrão so aparece como ação util quando não ha etapas carregadas;
- erros de duplicação ou validação aparecem dentro do modal.

### Frontend - Orçamentos

Objetivo:

- permitir cadastrar, listar, buscar, filtrar, editar, enviar e excluir orçamentos com itens, sempre vinculados a um cliente.

Usuário beneficiado:

- escritório de arquitetura que precisa formalizar propostas comerciais antes de converter uma venda em projeto.

Fluxo implementado:

1. Usuário acessa `/budgets`.
2. A tela carrega status via `/budgets/meta`.
3. A tela carrega clientes via `/clients`.
4. A tela lista orçamentos via `/budgets`.
5. Usuário pode buscar por orçamento, cliente, serviço ou item.
6. Usuário pode filtrar por status e cliente.
7. Usuário pode abrir o modal de novo orçamento.
8. Usuário seleciona um cliente obrigatório.
9. Usuário adiciona um ou mais itens com quantidade e valor unitário.
10. O backend calcula total bruto, desconto, total final e total de cada item.
11. Usuário pode editar um orçamento existente.
12. Usuário pode enviar um orçamento em rascunho ou negociação.
13. Usuário pode aprovar e converter um orçamento em projeto.
14. A conversão abre modal para definir dados iniciais do projeto.
15. O backend cria o projeto e atualiza o orçamento aprovado dentro de uma `$transaction`.
16. Usuário pode excluir orçamento com modal de confirmação.

Campos principais do formulário:

- cliente;
- título;
- tipo de serviço;
- status;
- desconto;
- validade;
- forma de pagamento;
- descrição;
- itens com descrição, quantidade e valor unitário;
- tipo e status inicial do projeto na conversão;
- datas, área, endereço e observações do projeto na conversão.

Regras consideradas:

- orçamento deve ter cliente;
- orçamento deve ter pelo menos um item;
- quantidade e valor unitário devem ser maiores que zero;
- desconto não pode ser negativo;
- frontend não calcula valores críticos;
- backend continua sendo a fonte da verdade;
- orçamento enviado exige pelo menos 1 item;
- orçamento aprovado vira projeto usando `$transaction`;
- projeto convertido recebe `contractedAmount` a partir do valor final do orçamento;
- orçamento já vinculado a projeto não pode ser convertido novamente;
- orçamento aprovado não pode ser excluído.

### Frontend - Financeiro

Objetivo:

- permitir gerar parcelas a partir de um projeto, registrar pagamentos e acompanhar indicadores financeiros reais.

Usuário beneficiado:

- escritório de arquitetura que precisa acompanhar valores contratados, recebidos, pendentes, vencendo e atrasados por projeto.

Fluxo implementado:

1. Usuário acessa `/financial`.
2. A tela carrega metadados via `/financial/meta`.
3. A tela carrega indicadores via `/financial/summary`.
4. A tela lista parcelas via `/financial/payments`.
5. Usuário pode buscar por parcela, projeto ou cliente.
6. Usuário pode filtrar por status, projeto e cliente.
7. Usuário pode gerar parcelas de um projeto com valor contratado.
8. O backend cria 1, 2 ou 3 parcelas a partir do `contractedAmount`.
9. Usuário pode criar uma parcela manual.
10. Usuário pode editar uma parcela ainda não cancelada.
11. Usuário pode registrar pagamento total ou parcial.
12. O backend define `paidAt` automaticamente quando a data não e informada.
13. Usuário pode cancelar parcela ainda não paga.
14. A tela recarrega indicadores e lista após cada mutação.

Campos principais:

- projeto;
- descrição da parcela;
- valor;
- número da parcela;
- vencimento;
- forma de pagamento;
- observações;
- valor pago;
- data de pagamento;
- quantidade de parcelas para geração.

Regras consideradas:

- parcela deve ter projeto;
- projeto deve existir;
- cliente da parcela e derivado do projeto;
- projeto precisa ter valor contratado para geração automática;
- parcelamento permitido: à vista, 2x ou 3x;
- data de pagamento não pode ser futura;
- valor pago deve ser maior que zero;
- valor pago não pode ser maior que a parcela;
- status atrasado vem calculado da API;
- frontend não calcula regra crítica.

### Frontend - Dashboard

Objetivo:

- exibir um resumo real do escritório com dados operacionais, financeiros e alertas.

Usuário beneficiado:

- escritório de arquitetura que precisa abrir o sistema e entender rapidamente clientes, projetos, recebimentos, atrasos e próximas entregas.

Fluxo implementado:

1. Usuário acessa `/`.
2. A tela chama `GET /dashboard`.
3. O backend agrega dados de clientes, projetos, financeiro e etapas.
4. A tela exibe cards operacionais e financeiros.
5. A tela mostra próximas entregas com progresso.
6. A tela mostra alertas calculados pelo backend.
7. Usuário pode atualizar o resumo manualmente.

Campos exibidos:

- clientes totais;
- projetos ativos;
- pagamentos atrasados;
- parcelas vencendo em 7 dias;
- receita do mês;
- receita do ano;
- valor a receber;
- ticket médio por projeto;
- progresso médio dos projetos ativos;
- próximas entregas;
- alertas operacionais.

Regras consideradas:

- dashboard não duplica regras financeiras no frontend;
- indicadores financeiros vêm do backend;
- progresso médio usa regra de etapas concluídas;
- atrasos e vencimentos vêm calculados dinamicamente;
- projetos finalizados e cancelados não entram como ativos.

### Frontend - Tarefas

Objetivo:

- permitir criar, acompanhar, filtrar e concluir tarefas gerais ou vinculadas a projetos.

Usuário beneficiado:

- escritório de arquitetura que precisa organizar pendências internas, atividades de projeto, responsáveis e prazos.

Fluxo implementado:

1. Usuário acessa `/tasks`.
2. A tela carrega status e prioridades via `/tasks/meta`.
3. A tela carrega projetos via `/projects`.
4. A tela lista tarefas via `/tasks`.
5. Usuário pode buscar por tarefa, responsável, projeto ou cliente.
6. Usuário pode filtrar por status, prioridade e projeto.
7. Usuário pode criar tarefa sem projeto ou vinculada a um projeto.
8. Usuário pode editar tarefa existente.
9. Usuário pode concluir tarefa aberta.
10. Usuário pode reabrir tarefa concluída ou cancelada.
11. Usuário pode cancelar tarefa aberta.
12. Usuário pode excluir tarefa com confirmação.

Campos principais:

- projeto opcional;
- título;
- descrição;
- responsável;
- prazo;
- prioridade;
- status;
- observações.

Regras consideradas:

- tarefa pode existir sem projeto;
- projeto vinculado precisa existir no backend;
- título deve ter pelo menos 2 caracteres;
- status e prioridade usam domínio oficial;
- prazo pode ficar vazio;
- atraso é calculado pela API;
- frontend não calcula regra crítica.

### Frontend - Visitas Técnicas

Objetivo:

- permitir registrar, acompanhar, filtrar e concluir visitas técnicas vinculadas obrigatoriamente a cliente e opcionalmente a projeto.

Usuário beneficiado:

- escritório de arquitetura que precisa controlar agenda externa, levantamentos, vistorias, reuniões presenciais e visitas de acompanhamento.

Fluxo implementado:

1. Usuário acessa `/visits`.
2. A tela carrega status e tipos via `/visits/meta`.
3. A tela carrega clientes via `/clients`.
4. A tela carrega projetos via `/projects`.
5. A tela lista visitas via `/visits`.
6. Usuário pode buscar por tipo, endereço, observações, cliente ou projeto.
7. Usuário pode filtrar por status, tipo, cliente e projeto.
8. Usuário cria visita com cliente obrigatório.
9. Usuário pode vincular a visita a um projeto do mesmo cliente.
10. Usuário pode editar visita existente.
11. Usuário pode concluir visita agendada.
12. Usuário pode reabrir visita concluída ou cancelada.
13. Usuário pode cancelar visita agendada.
14. Usuário pode excluir visita com confirmação.

Campos principais:

- cliente obrigatório;
- projeto opcional;
- tipo;
- data;
- horário;
- endereço;
- valor;
- status;
- observações.

Regras consideradas:

- cliente e obrigatório;
- projeto pode ficar vazio;
- projeto vinculado precisa pertencer ao mesmo cliente;
- data e obrigatória;
- horário deve seguir `HH:mm`;
- valor deve ser maior que zero quando informado;
- status e tipo usam domínio oficial;
- frontend não calcula regra crítica.

## Regras de negócio ja implementadas

Arquivo:

```txt
backend/src/shared/business-rules.ts
```

Regras:

- valor financeiro deve ser maior que zero;
- orçamento deve ter pelo menos um item;
- valor final do orçamento e calculado no backend;
- total de cada item de orçamento e calculado no backend;
- desconto não pode deixar valor final menor ou igual a zero;
- desconto de orçamento não pode ser negativo;
- orçamento aprovado vira projeto usando `$transaction`;
- projeto criado a partir de orçamento aprovado recebe valor contratado igual ao valor final do orçamento;
- progresso do projeto e calculado por etapas concluídas sobre total;
- progresso não aceita valores negativos;
- etapas concluídas não podem ultrapassar total de etapas;
- etapa não pode iniciar antes do início do projeto;
- etapa não pode ter prazo anterior ao início do projeto;
- etapa não pode ter prazo anterior ao próprio início;
- conclusão de etapa preenche `completedAt` no backend;
- reabertura de etapa limpa `completedAt` no backend;
- pagamento atrasado e calculado dinamicamente;
- pagamento pago ou cancelado não e considerado atrasado;
- pagamento deve estar vinculado a projeto;
- cliente do pagamento e derivado do projeto;
- valor de parcela e valor pago devem ser maiores que zero;
- pagamento total preenche `paidAt` e status `PAID`;
- pagamento parcial preenche `paidAt` e status `PARTIALLY_PAID`;
- data de pagamento futura e bloqueada;
- valor pago acima da parcela e bloqueado;
- parcelamento automático usa `contractedAmount` do projeto em 1x, 2x ou 3x;
- soma de parcelas acima do contratado gera alerta;
- documento deve ter cliente e/ou projeto.
- visita deve ter cliente obrigatório;
- visita pode ter projeto opcional;
- projeto de visita, quando informado, deve pertencer ao mesmo cliente;
- valor de visita deve ser positivo quando informado;
- visita cancelada não pode ser concluída;
- visita concluída não pode ser cancelada.

## Testes

Testes criados:

```txt
backend/src/shared/business-rules.test.ts
backend/src/modules/clients/clients.schema.test.ts
backend/src/modules/clients/clients.service.test.ts
backend/src/modules/projects/projects.schema.test.ts
backend/src/modules/projects/projects.service.test.ts
backend/src/modules/projectSteps/projectSteps.schema.test.ts
backend/src/modules/projectSteps/projectSteps.service.test.ts
backend/src/modules/budgets/budgets.schema.test.ts
backend/src/modules/budgets/budgets.service.test.ts
backend/src/modules/financial/financial.schema.test.ts
backend/src/modules/financial/financial.service.test.ts
backend/src/modules/dashboard/dashboard.service.test.ts
backend/src/modules/tasks/tasks.schema.test.ts
backend/src/modules/tasks/tasks.service.test.ts
backend/src/modules/visits/visits.schema.test.ts
backend/src/modules/visits/visits.service.test.ts
```

Cobertura atual:

- regras financeiras iniciais;
- cálculo de progresso;
- pagamento atrasado;
- dono obrigatório de documento;
- schema inicial de Clientes;
- e-mail vazio;
- e-mail inválido;
- CPF/CNPJ inválido;
- update parcial.
- metadados de status de Clientes;
- montagem de filtros de busca e status.
- schema inicial de Projetos;
- cliente obrigatório em Projetos;
- data de entrega anterior ao início bloqueada;
- valor contratado zero ou negativo bloqueado;
- metadados de status e tipos de Projetos;
- montagem de filtros de busca, cliente, status e tipo de Projetos.
- schema inicial de Etapas;
- projeto obrigatório para listar e gerar etapas;
- status oficial de etapa;
- data prevista anterior ao início da etapa bloqueada;
- metadados e templates de Etapas;
- cálculo de progresso por etapas concluídas;
- datas de etapa anteriores ao início do projeto bloqueadas.
- schema inicial de Orçamentos;
- cliente obrigatório em Orçamentos;
- orçamento com item obrigatório;
- valores de item zero ou negativos bloqueados;
- desconto negativo bloqueado;
- metadados de status de Orçamentos;
- montagem de filtros de busca, cliente, projeto e status de Orçamentos;
- cálculo de totais de orçamento no backend.
- validação de dados para aprovação/conversão de orçamento;
- preparação dos dados de projeto a partir de orçamento aprovado;
- bloqueios contra conversão de orçamento sem item, cancelado ou já convertido.
- schema de parcelas e geração financeira;
- parcelamento limitado a 1x, 2x ou 3x;
- divisão de parcelas com centavos preservados;
- status atrasado calculado dinamicamente;
- bloqueio de data de pagamento futura;
- bloqueio de valor pago acima da parcela;
- resumo financeiro por projeto e alerta acima do contratado.
- dashboard com progresso médio, próximas entregas e alertas reais.
- schema inicial de Tarefas;
- tarefa com projeto opcional;
- filtros de Tarefas por projeto, status, prioridade e prazo;
- busca de Tarefas por título, descrição, responsável, notas, projeto e cliente;
- atraso dinâmico de tarefa;
- schema inicial de Visitas;
- visita com cliente obrigatório e projeto opcional;
- filtros de Visitas por cliente, projeto, tipo, status e período;
- busca de Visitas por tipo, endereço, observações, cliente e projeto;
- validação de horário e valor positivo;
- bloqueio de projeto pertencente a outro cliente;

Validações ja executadas no estado atual:

- `npm run typecheck` passou;
- `npm run test` passou;
- `npm run lint` passou;

No ultimo fechamento da Fase 0.1 tambem passaram:

- `prisma validate` passou;
- `prisma migrate status` indicou banco atualizado;
- Prisma Client foi regenerado.

## Documentação existente

Arquivos de documentação:

- `README.md`
- `SETUP.md`
- `API.md`
- `DATABASE.md`
- `DESIGN_SYSTEM.md`
- `BUSINESS_RULES.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `USER_GUIDE.md`
- `docs/phase-0.md`
- `docs/api-contract.md`
- `docs/domain-glossary.md`
- `docs/registro-do-projeto.md`

## Como rodar o projeto

Instalar dependencias:

```bash
corepack pnpm install
```

Rodar frontend e backend:

```bash
npm run dev
```

Rodar validacoes:

```bash
npm run typecheck
npm run test
npm run lint
```

Validar Prisma:

```bash
cd backend
corepack pnpm exec prisma validate
corepack pnpm exec prisma migrate status
```

Gerar Prisma Client:

```bash
corepack pnpm --filter @arqflow/backend prisma:generate
```

## Endpoints atuais

Backend local:

```txt
http://localhost:3333
```

Endpoints:

```txt
GET /health
GET /dashboard
GET /clients/meta
GET /clients
GET /clients/:id
GET /clients/:id/delete-impact
POST /clients
PATCH /clients/:id
DELETE /clients/:id
GET /budgets/meta
GET /budgets
GET /budgets/:id
POST /budgets
PATCH /budgets/:id
PATCH /budgets/:id/send
PATCH /budgets/:id/approve
DELETE /budgets/:id
GET /financial/meta
GET /financial/summary
GET /financial/payments
POST /financial/payments
PATCH /financial/payments/:id
PATCH /financial/payments/:id/pay
PATCH /financial/payments/:id/cancel
POST /financial/installments
GET /tasks/meta
GET /tasks
GET /tasks/:id
POST /tasks
PATCH /tasks/:id
PATCH /tasks/:id/complete
PATCH /tasks/:id/reopen
PATCH /tasks/:id/cancel
DELETE /tasks/:id
GET /visits/meta
GET /visits
GET /visits/:id
POST /visits
PATCH /visits/:id
PATCH /visits/:id/complete
PATCH /visits/:id/reopen
PATCH /visits/:id/cancel
DELETE /visits/:id
GET /projects/meta
GET /projects
GET /projects/:id
GET /projects/:id/delete-impact
POST /projects
PATCH /projects/:id
DELETE /projects/:id
GET /project-steps/meta
GET /project-steps?projectId=:projectId
POST /project-steps/generate-defaults
PATCH /project-steps/:id
PATCH /project-steps/:id/complete
PATCH /project-steps/:id/reopen
```

Frontend local:

```txt
http://localhost:5173
```

## O que não deve ir para o repositório

Não versionar:

- `node_modules/`
- `.env`
- `dist/`
- `coverage/`
- `*.log`
- `*.tsbuildinfo`
- `backend/prisma/*.db`
- `backend/prisma/*.db-journal`

Versionar:

- codigo fonte;
- migrations;
- documentação;
- arquivos de configuração;
- testes.

## Proximo passo recomendado

Validar Visitas Técnicas no navegador e iniciar a próxima fatia recomendada: Documentos com caminho local, vinculados a cliente e/ou projeto.

Ponto de retomada para amanhã:

- continuar a partir do módulo de Documentos;
- usar os agentes Arquiteto, Banco/Prisma, Backend/API, Frontend/UI, Formulários, Qualidade e Documentação;
- implementar vínculo por cliente e/ou projeto, tipo, título, caminho local do arquivo, descrição e confirmação de exclusão;
- manter `README.md` e `docs/registro-do-projeto.md` atualizados.

Ordem sugerida:

1. Rodar `npm run typecheck`, `npm run test` e `npm run lint`.
2. Abrir `http://localhost:5173/visits`.
3. Criar uma visita técnica com cliente obrigatório e sem projeto.
4. Criar uma visita técnica vinculada a um projeto do mesmo cliente.
5. Testar filtros por status, tipo, cliente e projeto.
6. Concluir uma visita.
7. Reabrir uma visita.
8. Cancelar uma visita.
9. Excluir uma visita com confirmação.
10. Depois iniciar Documentos.

## Pontos de atencao para Clientes

Ao implementar Clientes, lembrar:

- cliente deve ter nome;
- cliente deve ter telefone ou WhatsApp;
- e-mail deve ser unico quando informado;
- CPF/CNPJ e opcional, mas deve ser valido quando preenchido;
- busca deve procurar por nome, e-mail, telefone e WhatsApp;
- exclusão deve verificar vínculos antes de apagar;
- se houver projeto, orçamento, pagamento, visita, documento ou briefing vinculado, a API deve retornar impacto estruturado;
- frontend deve mostrar modal de confirmação/impacto antes de exclusão;
- backend continua sendo a fonte da verdade.

## Pontos de atencao para Etapas de Projeto

Ao evoluir Etapas, lembrar:

- etapa sempre deve pertencer a projeto;
- projeto deve existir antes de listar, gerar ou alterar etapas;
- `sortOrder` deve continuar unico por projeto;
- geração padrão não deve duplicar etapas existentes;
- progresso deve continuar derivado de `status = COMPLETED`;
- `completedAt` deve ser gerenciado pelo backend;
- datas devem ser validadas no backend contra o início do projeto;
- frontend pode melhorar UX, mas não deve substituir a regra do backend.

## Pontos de atencao para Orçamentos

Ao evoluir Orçamentos, lembrar:

- orçamento sempre deve pertencer a cliente;
- projeto vinculado, quando existir, deve pertencer ao mesmo cliente;
- orçamento enviado deve ter pelo menos um item;
- total bruto, total final e total de item devem continuar calculados no backend;
- desconto não pode ser negativo nem zerar o valor final;
- conversão de orçamento aprovado em projeto deve usar `$transaction`;
- orçamento já convertido não deve criar projeto duplicado;
- projeto criado deve herdar cliente e valor final do orçamento;
- valores financeiros não devem ser confiados apenas pelo frontend;
- exclusões críticas devem continuar passando por confirmação.

## Pontos de atencao para Financeiro

Ao evoluir Financeiro, lembrar:

- pagamento sempre deve pertencer a projeto;
- cliente do pagamento deve continuar derivado do projeto no backend;
- status atrasado deve continuar dinâmico;
- não gravar atraso como única fonte da verdade;
- data de pagamento futura deve continuar bloqueada;
- valor pago acima da parcela deve continuar bloqueado;
- geração automática deve continuar usando valor contratado do projeto;
- soma de parcelas acima do contratado deve gerar alerta;
- indicadores financeiros devem ser calculados no backend;
- frontend deve melhorar UX, mas não substituir regras críticas.

## Pontos de atencao para Tarefas

Ao evoluir Tarefas, lembrar:

- tarefa pode existir sem projeto;
- se `projectId` for informado, o projeto deve existir;
- status e prioridade devem continuar centralizados no domínio;
- atraso deve continuar calculado dinamicamente;
- tarefas concluídas ou canceladas não devem aparecer como atrasadas;
- exclusão deve continuar passando por confirmação visual;
- se a auditoria de conclusão ficar importante, adicionar `completedAt` via migration;
- frontend pode melhorar UX, mas backend deve validar o vínculo com projeto.

## Pontos de atencao para Visitas Técnicas

Ao evoluir Visitas Técnicas, lembrar:

- visita deve ter cliente obrigatório;
- visita pode ter projeto opcional;
- projeto de visita, quando informado, deve pertencer ao mesmo cliente;
- valor de visita deve ser positivo quando informado;
- visita cancelada não pode ser concluída;
- visita concluída não pode ser cancelada.
- status e tipos devem continuar centralizados no domínio;
- data deve continuar obrigatória;
- horário deve continuar validado em `HH:mm`;
- exclusão deve continuar passando por confirmação visual;
- frontend pode melhorar UX, mas backend deve validar os vínculos.

## Sugestao de commit para o estado atual

```txt
feat(visits): add technical visits module
```

Resumo sugerido:

```txt
- Create monorepo foundation with frontend and backend workspaces
- Add Prisma SQLite schema, migrations and seed
- Add Express API base with validation and error handling
- Add dark premium frontend shell and reusable UI components
- Add initial business rules and tests
- Add technical documentation for setup, API, database, design system and roadmap
- Implement Clients backend CRUD
- Implement Clients frontend list, form, filters and protected delete flow
- Implement Projects backend CRUD with required client relation
- Implement Projects frontend list, form, filters and protected delete flow
- Implement Project Steps backend API with default generation and progress rules
- Implement Project Steps frontend modal for generation, completion and reopening
- Implement Budgets backend API with item totals and send action
- Implement Budgets frontend list, form, filters and delete confirmation
- Add transactional budget approval and project conversion
- Add frontend approval modal for creating projects from budgets
- Add financial API for installments, payment registration and summary
- Add financial frontend page with indicators, filters and payment actions
- Add real dashboard summary backed by financial and project data
- Add task API with optional project relation, priorities, statuses and deadlines
- Add task frontend page with filters, form and quick actions
- Add technical visits API with required client relation and optional project relation
- Add technical visits frontend page with filters, form and quick actions
- Update project registry and README
```

## Como retomar se algo der errado

1. Ler `AGENTS.md`.
2. Ler este documento.
3. Rodar:

```bash
npm run typecheck
npm run test
npm run lint
```

4. Validar banco:

```bash
cd backend
corepack pnpm exec prisma validate
corepack pnpm exec prisma migrate status
```

5. Se Prisma Client estiver desatualizado:

```bash
corepack pnpm --filter @arqflow/backend prisma:generate
```

6. Se o problema for no banco local:

- conferir migrations em `backend/prisma/migrations`;
- não editar `dev.db` manualmente sem necessidade;
- preferir migrations Prisma;
- lembrar que `dev.db` não deve ser commitado.

7. Se o problema for em regra de negócio:

- procurar primeiro em `backend/src/shared/business-rules.ts`;
- adicionar ou ajustar teste antes de espalhar logica pelo sistema.

8. Se o problema for em UI:

- conferir `DESIGN_SYSTEM.md`;
- reaproveitar componentes de `frontend/src/components/ui`;
- manter dark premium e consistencia visual.

