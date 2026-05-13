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

## Orçamentos

O módulo de Orçamentos já possui uma primeira fatia vertical:

- API REST com listagem, busca, filtro por status e cliente.
- Criação e edição de orçamento com cliente obrigatório e itens.
- Cálculo de `totalAmount`, `finalAmount` e total de cada item sempre no backend.
- Validação backend de valores positivos, desconto não negativo e pelo menos 1 item.
- Envio de orçamento em rascunho ou negociação via `PATCH /budgets/:id/send`.
- Aprovação/conversão de orçamento em projeto via `PATCH /budgets/:id/approve`, usando `$transaction`.
- Projeto criado a partir do orçamento aprovado recebe `contractedAmount` com o valor final calculado pelo backend.
- Exclusão com confirmação, preservando bloqueio para orçamento aprovado.
- Tela `/budgets` conectada ao backend real.
- Formulário com React Hook Form, Zod e itens dinâmicos.
- Status oficiais de orçamento com badges visuais.

## Financeiro e Parcelas

O módulo Financeiro iniciou o fluxo de parcelas e pagamentos:

- API REST em `/financial` com metadados, resumo, listagem, criação, edição, pagamento e cancelamento de parcelas.
- Geração de parcelas a partir de projeto com `contractedAmount`, usando 1x, 2x ou 3x.
- Cliente da parcela derivado do projeto no backend.
- Status atrasado calculado dinamicamente pelo backend.
- Registro de pagamento total ou parcial via `PATCH /financial/payments/:id/pay`.
- Data de pagamento preenchida automaticamente quando não informada.
- Bloqueio de data de pagamento futura e de valor pago maior que a parcela.
- Indicadores financeiros: receita do mês, receita do ano, valor a receber, recebido, atrasado, vencendo em 7 dias, orçamentos aprovados/recusados e ticket médio.
- Tela `/financial` conectada ao backend real.
- Formulários com React Hook Form e Zod para parcela manual, geração de parcelas e registro de pagamento.
- Alertas quando a soma das parcelas ultrapassa o valor contratado do projeto.

## Dashboard

O Dashboard passou a consumir dados reais do backend:

- API `GET /dashboard` com resumo operacional e financeiro.
- Contagem real de clientes, projetos ativos, pagamentos atrasados e parcelas vencendo em 7 dias.
- Reaproveitamento do resumo financeiro de `/financial/summary`.
- Próximas entregas calculadas a partir dos projetos ativos.
- Progresso médio calculado a partir das etapas dos projetos.
- Alertas reais para pagamentos atrasados, vencimentos próximos, entregas próximas e parcelas acima do contratado.
- Tela inicial conectada à API, com estados de carregamento, erro e atualização manual.

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
Orçamentos: http://localhost:5173/budgets
Financeiro: http://localhost:5173/financial
```
