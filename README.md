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

Registro completo do estado atual: `docs/registro-do-projeto.md`.

## Comandos previstos

```bash
corepack pnpm install
npm run dev
npm run typecheck
npm run test
```

> Em ambientes sem shim global do pnpm, use `corepack pnpm`.
