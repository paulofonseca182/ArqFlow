# ArqFlow

Sistema local de gestao para escritorios de arquitetura.

## Fase 0

Esta base define a estrutura tecnica inicial do projeto antes da Fase 1:

- Monorepo com `frontend/` e `backend/`.
- TypeScript estrito nos dois lados.
- Backend em Express, Prisma e SQLite.
- Frontend em React, Vite, Tailwind e React Router.
- Schema Prisma inicial com os dominios do MVP.
- Decisoes de arquitetura registradas em `docs/`.

## Fase 0.1

A Fase 0.1 alinha a base ao `AGENTS.md`:

- UI dark premium.
- Componentes obrigatorios iniciais.
- Padrao backend `routes/controller/service/schema`.
- Contratos de dominio centralizados.
- Testes iniciais de regras criticas.
- Documentacao tecnica minima.

## Clientes

O modulo de Clientes ja possui backend e frontend iniciais:

- API REST com listagem, busca, filtro por status, cadastro, edicao e exclusao protegida.
- Tela `/clients` conectada ao backend real.
- Formulario com React Hook Form e Zod.
- Validacao de nome, email, CPF/CNPJ e telefone ou WhatsApp.
- Consulta de impacto antes da exclusao.
- Estados de carregamento, vazio, erro, sucesso e paginacao simples.

## Projetos

O modulo de Projetos ja possui uma primeira fatia vertical:

- API REST com listagem, busca, filtro por status, tipo e cliente.
- Criacao e edicao de projeto com cliente obrigatorio.
- Validacao backend de cliente existente, datas e valores positivos.
- Tela `/projects` conectada ao backend real.
- Formulario com React Hook Form e Zod.
- Progresso exibido a partir das etapas existentes.
- Exclusao protegida por impacto de vinculos.

## Etapas de Projeto

O modulo de Etapas de Projeto ja esta integrado ao fluxo de Projetos:

- API REST em `/project-steps`.
- Geracao de etapas padrao conforme o tipo do projeto.
- Template padrao: Briefing, Levantamento, Anteprojeto, Projeto 3D, Projeto executivo e Entrega final.
- Protecao contra duplicacao de etapas ja geradas.
- Listagem de etapas ordenadas por projeto.
- Conclusao e reabertura de etapas com `completedAt` controlado pelo backend.
- Validacao backend para bloquear datas anteriores ao inicio do projeto.
- Progresso real calculado por etapas concluidas sobre total.
- Modal de etapas na tela `/projects`, com acao para gerar, concluir e reabrir etapas.
- Testes de schema, templates, validacao de datas e calculo de progresso.

Registro completo do estado atual: `docs/registro-do-projeto.md`.

## Comandos previstos

```bash
corepack pnpm install
npm run dev
npm run typecheck
npm run test
npm run lint
```

> Em ambientes sem shim global do pnpm, use `corepack pnpm`.

## URLs locais

```txt
Frontend: http://localhost:5173
Backend: http://localhost:3333
Clientes: http://localhost:5173/clients
Projetos: http://localhost:5173/projects
```
