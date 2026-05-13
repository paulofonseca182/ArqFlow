# ArqFlow

Sistema local de gestão para escritórios de arquitetura.

## Fase 0

Esta base define a estrutura técnica inicial do projeto antes da Fase 1:

- Monorepo com `frontend/` e `backend/`.
- TypeScript estrito nos dois lados.
- Backend em Express, Prisma e SQLite.
- Frontend em React, Vite, Tailwind e React Router.
- Schema Prisma inicial com os domínios do MVP.
- Decisões de arquitetura registradas em `docs/`.

## Fase 0.1

A Fase 0.1 alinha a base ao `AGENTS.md`:

- UI dark premium.
- Componentes obrigatórios iniciais.
- Padrão backend `routes/controller/service/schema`.
- Contratos de domínio centralizados.
- Testes iniciais de regras críticas.
- Documentação técnica mínima.

## Clientes

O módulo de Clientes já possui backend e frontend iniciais:

- API REST com listagem, busca, filtro por status, cadastro, edição e exclusão protegida.
- Tela `/clients` conectada ao backend real.
- Formulário com React Hook Form e Zod.
- Validação de nome, e-mail, CPF/CNPJ e telefone ou WhatsApp.
- Consulta de impacto antes da exclusão.
- Estados de carregamento, vazio, erro, sucesso e paginação simples.

## Projetos

O módulo de Projetos já possui uma primeira fatia vertical:

- API REST com listagem, busca, filtro por status, tipo e cliente.
- Criação e edição de projeto com cliente obrigatório.
- Validação backend de cliente existente, datas e valores positivos.
- Status oficial `Desenho 3D em desenvolvimento` logo após `Aguardando aprovação do cliente`.
- Tela `/projects` conectada ao backend real.
- Formulário com React Hook Form e Zod.
- Progresso exibido a partir das etapas existentes.
- Exclusão protegida por impacto de vínculos.
- Botões da coluna Ações compactados em estilo minimalista, com traço fino nos ícones e tooltip de ação ao passar o mouse.
- Ícones dos controles de busca e atualização padronizados com o mesmo tamanho, traço e tooltip dos botões de ação.
- Textos visíveis do app e mensagens principais da API revisados com acentuação em português.

## Etapas de Projeto

O módulo de Etapas de Projeto já está integrado ao fluxo de Projetos:

- API REST em `/project-steps`.
- Geração de etapas padrão conforme o tipo do projeto.
- Template padrão: Briefing, Levantamento, Anteprojeto, Projeto 3D, Projeto executivo e Entrega final.
- Proteção contra duplicação de etapas já geradas.
- Listagem de etapas ordenadas por projeto.
- Conclusão e reabertura de etapas com `completedAt` controlado pelo backend.
- Validação backend para bloquear datas anteriores ao início do projeto.
- Progresso real calculado por etapas concluídas sobre total.
- Modal de etapas na tela `/projects`, com ação para gerar, concluir e reabrir etapas.
- Testes de schema, templates, validação de datas e cálculo de progresso.

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
