# Banco de Dados

## Tecnologia

- SQLite 3+
- Prisma ORM 5+
- Banco local em `backend/prisma/dev.db`

## Modelos do MVP

- `Client`
- `Project`
- `ProjectStep`
- `Budget`
- `BudgetItem`
- `Payment`
- `Task`
- `Visit`

## Integridade

- `Project` sempre exige `clientId`.
- `Budget` sempre exige `clientId` e pode ter `projectId` nulo.
- `Payment` sempre exige `projectId` e `clientId`.
- `Task` e `Visit` podem se vincular a projeto conforme o fluxo.
- `BudgetItem` pertence a `Budget`.

## Exclusoes

- Cliente usa relacoes restritivas para proteger historico.
- Projeto apaga etapas em cascata.
- Projeto nao apaga pagamentos automaticamente; dados financeiros bloqueiam a exclusao ate tratamento explicito.
- Vinculos opcionais usam `SetNull` quando a preservacao do registro for mais importante que a exclusao.

## SQLite

O servidor ativa `PRAGMA foreign_keys = ON` na inicializacao.

## Status e tipos

SQLite nao usa enums nativos no Prisma. Por isso, status e tipos ficam como `String` no banco e sao padronizados em `backend/src/shared/domain.ts`.
