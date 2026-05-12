# Registro do Projeto ArqFlow

Data de criacao: 2026-05-12

Este documento registra o que foi feito ate aqui no ArqFlow, as decisoes tecnicas tomadas, o estado atual do projeto e os proximos passos recomendados. A ideia e servir como ponto de consulta caso algo quebre, o contexto se perca ou seja necessario entender rapidamente por que a base foi montada dessa forma.

## Objetivo do projeto

O ArqFlow e um sistema local de gestao para escritorios de arquitetura.

O MVP deve centralizar:

- clientes;
- projetos;
- etapas;
- orcamentos;
- financeiro;
- tarefas;
- visitas tecnicas;
- documentos;
- briefings;
- relatorios;
- dashboard operacional.

O modo inicial do sistema e local, rodando em `localhost`, com banco SQLite local. A evolucao futura pode incluir autenticacao, permissoes, backup, integracoes e versao cloud.

## Fontes de referencia

As principais referencias usadas ate aqui foram:

- PDF inicial do cronograma completo do ArqFlow.
- `AGENTS.md`, que define stack, regras, agentes, padroes de codigo e identidade visual.
- Decisoes tomadas durante a Fase 0 e Fase 0.1.

O `AGENTS.md` e a referencia principal para qualquer nova tarefa.

Antes de alterar codigo, sempre:

1. Ler `AGENTS.md`.
2. Entender o modulo afetado.
3. Verificar impacto em frontend, backend, banco e validacoes.
4. Fazer alteracoes pequenas, consistentes e testaveis.
5. Manter regras criticas no backend.
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

## Fases concluidas

### Fase 0 - Fundacao tecnica

Foi criada a estrutura inicial do projeto:

- monorepo com `frontend/` e `backend/`;
- configuracao de workspace com `pnpm-workspace.yaml`;
- scripts principais no `package.json` da raiz;
- configuracoes TypeScript no frontend e backend;
- estrutura inicial de backend Express;
- estrutura inicial de frontend React/Vite;
- schema Prisma inicial;
- seed inicial;
- documentacao tecnica base.

### Fase 0.1 - Alinhamento com AGENTS.md

A Fase 0.1 ajustou a base para ficar coerente com o `AGENTS.md`.

Foram feitos:

- alinhamento visual para dark premium;
- criacao de componentes UI obrigatorios;
- criacao do padrao backend `routes/controller/service/schema`;
- centralizacao de contratos de dominio e status;
- criacao de regras de negocio puras;
- criacao de testes iniciais;
- correcao do drift do banco local;
- sincronizacao das migrations Prisma;
- regeneracao do Prisma Client;
- documentacao minima de setup, API, banco, design system, regras e roadmap.

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

Decisoes importantes:

- `Project` exige `clientId`.
- `Budget` exige `clientId` e pode ter `projectId` nulo.
- `Payment` exige `projectId` e `clientId`.
- `Task` pode existir sem projeto.
- `Visit` pode existir sem projeto, mas exige cliente.
- `Document` pode ter cliente e/ou projeto, mas nao pode ficar sem dono.
- `Briefing` exige cliente e pode ter projeto nulo.
- `BudgetItem` pertence a `Budget`.
- `BriefingAnswer` pertence a `Briefing`.

Regras tecnicas:

- `PRAGMA foreign_keys = ON` e ativado na inicializacao do servidor e no seed.
- Status e tipos ficam como `String` no SQLite.
- Contratos de status/tipos ficam centralizados em `backend/src/shared/domain.ts`.
- `Payment -> Project` usa `Restrict`, para evitar apagar pagamentos automaticamente ao excluir projeto.
- `Document` possui protecao para nao ficar sem `clientId` nem `projectId`.

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
- rota inicial `GET /clients/meta`.

Arquivos compartilhados importantes:

- `backend/src/shared/http.ts`: contrato de resposta.
- `backend/src/shared/errors.ts`: erros da aplicacao e tratamento de erros.
- `backend/src/shared/async-handler.ts`: wrapper para controllers async.
- `backend/src/shared/pagination.ts`: helper de paginacao.
- `backend/src/shared/domain.ts`: status e tipos oficiais.
- `backend/src/shared/business-rules.ts`: regras puras testaveis.
- `backend/src/middleware/validateRequest.ts`: validacao Zod de `body`, `params` e `query`.

Tratamento de erros:

- Zod retorna erro de validacao.
- Prisma `P2002` retorna conflito de unicidade.
- Prisma `P2025` retorna registro nao encontrado.
- Prisma `P2003` retorna bloqueio por chave estrangeira.
- Erros inesperados retornam erro interno.

## Modulo de Clientes - estado atual

O modulo de Clientes ainda nao tem CRUD completo.

Ja existe a base:

```txt
backend/src/modules/clients/
  clients.routes.ts
  clients.controller.ts
  clients.service.ts
  clients.schema.ts
  clients.schema.test.ts
```

Implementado ate agora:

- `GET /clients/meta`;
- schemas Zod iniciais;
- testes de schema;
- status de clientes centralizados;
- validacao de e-mail;
- normalizacao de e-mail vazio;
- validacao de CPF/CNPJ;
- exigencia de telefone ou WhatsApp na criacao.

Ainda falta:

- `GET /clients`;
- `GET /clients/:id`;
- `POST /clients`;
- `PATCH /clients/:id`;
- `DELETE /clients/:id`;
- busca por nome, e-mail, telefone e WhatsApp;
- paginacao;
- filtro por status;
- exclusao protegida com contagem de vinculos;
- testes de service de Clientes.

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
- Clientes
- Projetos
- Orcamentos
- Financeiro
- Tarefas
- Visitas
- Documentos
- Briefings
- Relatorios
- Configuracoes

Observacao:

- As telas alem do Dashboard ainda sao placeholders.
- O proximo grande passo de frontend sera a tela de Clientes.

## Regras de negocio ja implementadas

Arquivo:

```txt
backend/src/shared/business-rules.ts
```

Regras:

- valor financeiro deve ser maior que zero;
- orcamento deve ter pelo menos um item;
- valor final do orcamento e calculado no backend;
- desconto nao pode deixar valor final menor ou igual a zero;
- progresso do projeto e calculado por etapas concluidas sobre total;
- progresso nao aceita valores negativos;
- etapas concluidas nao podem ultrapassar total de etapas;
- pagamento atrasado e calculado dinamicamente;
- pagamento pago ou cancelado nao e considerado atrasado;
- documento deve ter cliente e/ou projeto.

## Testes

Testes criados:

```txt
backend/src/shared/business-rules.test.ts
backend/src/modules/clients/clients.schema.test.ts
```

Cobertura atual:

- regras financeiras iniciais;
- calculo de progresso;
- pagamento atrasado;
- dono obrigatorio de documento;
- schema inicial de Clientes;
- e-mail vazio;
- e-mail invalido;
- CPF/CNPJ invalido;
- update parcial.

No ultimo fechamento da Fase 0.1:

- `npm run typecheck` passou;
- `npm run test` passou;
- `npm run lint` passou;
- `prisma validate` passou;
- `prisma migrate status` indicou banco atualizado;
- Prisma Client foi regenerado.

## Documentacao existente

Arquivos de documentacao:

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
```

Frontend local:

```txt
http://localhost:5173
```

## O que nao deve ir para o repositorio

Nao versionar:

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
- documentacao;
- arquivos de configuracao;
- testes.

## Proximo passo recomendado

Iniciar o modulo de Clientes pelo backend.

Ordem sugerida:

1. Implementar `GET /clients` com paginacao, busca e filtro por status.
2. Implementar `GET /clients/:id`.
3. Implementar `POST /clients`.
4. Implementar `PATCH /clients/:id`.
5. Implementar `DELETE /clients/:id` com exclusao protegida.
6. Criar testes de service de Clientes.
7. Depois iniciar a tela de Clientes no frontend.

## Pontos de atencao para Clientes

Ao implementar Clientes, lembrar:

- cliente deve ter nome;
- cliente deve ter telefone ou WhatsApp;
- e-mail deve ser unico quando informado;
- CPF/CNPJ e opcional, mas deve ser valido quando preenchido;
- busca deve procurar por nome, e-mail, telefone e WhatsApp;
- exclusao deve verificar vinculos antes de apagar;
- se houver projeto, orcamento, pagamento, visita, documento ou briefing vinculado, a API deve retornar impacto estruturado;
- frontend deve mostrar modal de confirmacao/impacto antes de exclusao;
- backend continua sendo a fonte da verdade.

## Sugestao de commit para o estado atual

```txt
chore: setup ArqFlow foundation and phase 0.1 alignment
```

Resumo sugerido:

```txt
- Create monorepo foundation with frontend and backend workspaces
- Add Prisma SQLite schema, migrations and seed
- Add Express API base with validation and error handling
- Add dark premium frontend shell and reusable UI components
- Add initial business rules and tests
- Add technical documentation for setup, API, database, design system and roadmap
- Prepare Clients module foundation
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
- nao editar `dev.db` manualmente sem necessidade;
- preferir migrations Prisma;
- lembrar que `dev.db` nao deve ser commitado.

7. Se o problema for em regra de negocio:

- procurar primeiro em `backend/src/shared/business-rules.ts`;
- adicionar ou ajustar teste antes de espalhar logica pelo sistema.

8. Se o problema for em UI:

- conferir `DESIGN_SYSTEM.md`;
- reaproveitar componentes de `frontend/src/components/ui`;
- manter dark premium e consistencia visual.
