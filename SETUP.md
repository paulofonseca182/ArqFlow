# Setup do ArqFlow

## Requisitos

- Node.js 20+
- pnpm 8+ via Corepack
- SQLite local via Prisma

## Instalar dependencias

```bash
corepack prepare pnpm@8.15.9 --activate
corepack pnpm install
```

## Variaveis locais

O backend usa `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
PORT=3333
CORS_ORIGIN="http://localhost:5173"
```

## Comandos principais

```bash
npm run typecheck
npm run test
npm run dev
```

## Banco local

O banco fica em `backend/prisma/dev.db`. As migrations ficam em `backend/prisma/migrations/`.

Em caso de ambiente sem shim global do `pnpm`, use sempre `corepack pnpm`.
