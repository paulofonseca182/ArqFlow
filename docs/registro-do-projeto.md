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
- rota inicial `GET /dashboard`;
- rota inicial `GET /clients/meta`;
- modulo de Clientes em `/clients`;
- modulo inicial de Projetos em `/projects`;
- modulo de Etapas de Projeto em `/project-steps`.

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

Foi aplicada a identidade visual dark premium definida no `AGENTS.md`.

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

Rotas iniciais:

- Dashboard
- Clientes, ja conectada a tela real
- Projetos, ja conectada a tela real inicial
- Orçamentos
- Financeiro
- Tarefas
- Visitas
- Documentos
- Briefings
- Relatórios
- Configurações

Observação:

- As telas alem de Dashboard, Clientes, Projetos e Etapas de Projeto ainda sao placeholders.
- Clientes foi a primeira tela operacional do MVP.
- Projetos é a segunda fatia operacional e depende de Cliente como vínculo obrigatório.
- Etapas de Projeto é a terceira fatia operacional e alimenta o progresso real de Projetos.

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

## Regras de negócio ja implementadas

Arquivo:

```txt
backend/src/shared/business-rules.ts
```

Regras:

- valor financeiro deve ser maior que zero;
- orçamento deve ter pelo menos um item;
- valor final do orçamento e calculado no backend;
- desconto não pode deixar valor final menor ou igual a zero;
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
- documento deve ter cliente e/ou projeto.

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

Validar o fluxo de Etapas de Projeto no navegador e iniciar a próxima fatia recomendada: Orçamentos.

Ordem sugerida:

1. Rodar `npm run typecheck`, `npm run test` e `npm run lint`.
2. Abrir `http://localhost:5173/projects`.
3. Abrir o modal de etapas de um projeto sem etapas.
4. Gerar etapas padrão e confirmar que a lista aparece ordenada.
5. Tentar gerar novamente e confirmar bloqueio contra duplicação.
6. Concluir uma etapa e confirmar aumento do progresso.
7. Reabrir a etapa e confirmar reducao do progresso.
8. Confirmar que a barra de progresso da tabela de Projetos reflete a API.
9. Tentar excluir projeto com etapas e confirmar bloqueio.
10. Depois iniciar Orçamentos com cliente obrigatório e possível vínculo a projeto.

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

## Sugestao de commit para o estado atual

```txt
feat(project-steps): implement project step workflow
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

