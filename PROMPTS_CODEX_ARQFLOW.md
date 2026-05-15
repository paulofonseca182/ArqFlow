# Prompts recomendados para usar no Codex — ArqFlow

## Fase 1 — Fundação

```txt
Leia o AGENTS.md e implemente a Fase 1 do ArqFlow: monorepo pnpm, frontend Vite React TypeScript, backend Express TypeScript, Tailwind, Prisma SQLite, estrutura de pastas, layout base e dashboard inicial. Faça em etapas e explique os arquivos alterados.
```

## Banco de dados

```txt
Leia o AGENTS.md e crie o schema.prisma inicial do ArqFlow com os modelos Client, Project, ProjectStep, Budget, BudgetItem, Payment, Task e Visit. Respeite as regras de relacionamento, nullable FKs e integridade.
```

## Clientes

```txt
Implemente o módulo Clients completo seguindo o AGENTS.md: Prisma model, rotas Express, controller, service, schema Zod, página de listagem, formulário React Hook Form, página de detalhes, busca e modal de exclusão protegida.
```

## Projetos

```txt
Implemente o módulo Projects seguindo o AGENTS.md: projeto vinculado a cliente, filtros por status/tipo/cliente, página de detalhes com abas, progresso calculado pelas etapas e notas rápidas.
```

## Orçamentos

```txt
Implemente o módulo Budgets seguindo o AGENTS.md: orçamento com itens, cálculo do valor final no backend, validação para envio, status, duplicação e conversão em projeto via Prisma transaction.
```

## Financeiro

```txt
Implemente o módulo Financial seguindo o AGENTS.md: cadastro de parcelas, status financeiro, cálculo de atraso dinâmico, marcar como pago, resumo financeiro por projeto e alertas no dashboard.
```

## Testes

```txt
Crie testes com Vitest para as regras críticas do ArqFlow descritas no AGENTS.md, começando por clientes, projetos, orçamento convertido em projeto e pagamentos atrasados.
```
