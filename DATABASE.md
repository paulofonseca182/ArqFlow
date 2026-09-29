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
- `Expense`
- `ExpensePayment`
- `CashMovement`
- `FinancialCategory`
- `CashAccount`
- `Task`
- `Visit`

## Integridade

- `Project` sempre exige `clientId`.
- `Budget` sempre exige `clientId` e pode ter `projectId` nulo.
- `Payment` sempre exige `projectId` e `clientId`.
- `Payment` representa contas a receber e preserva compatibilidade com parcelas de projeto e cobranças de visita.
- `Expense` representa contas a pagar e pode ter `projectId` e `clientId` opcionais.
- `Expense.entryType` diferencia `SINGLE`, `PURCHASE` e `INSTALLMENT`.
- `Expense.parentExpenseId` vincula parcelas (`INSTALLMENT`) a uma compra principal (`PURCHASE`).
- `Expense.classification` diferencia despesa operacional, aquisição de bem/investimento, custo de projeto e outros usos gerenciais.
- `Expense.paidAmount` armazena o total já baixado naquela parcela.
- `ExpensePayment` preserva cada baixa individual de despesa ou parcela, com valor, data, conta e forma de pagamento.
- `CashMovement` representa somente caixa realizado, com entradas e saídas efetivas.
- `FinancialCategory` classifica receitas e despesas.
- `CashAccount` representa contas de caixa/banco usadas em movimentações.
- `Task` e `Visit` podem se vincular a projeto conforme o fluxo.
- `BudgetItem` pertence a `Budget`.
- Pagamento de recebível gera `CashMovement` de entrada.
- Pagamento de despesa gera `ExpensePayment` e `CashMovement` de saída.
- Valores previstos não entram no caixa até existir pagamento efetivo.
- Compra parcelada não entra duplicada no fluxo: a compra principal guarda a obrigação total e as parcelas guardam vencimentos e saldos.

## Exclusoes

- Cliente usa relacoes restritivas para proteger historico.
- Projeto apaga etapas em cascata.
- Projeto nao apaga pagamentos automaticamente; dados financeiros bloqueiam a exclusao ate tratamento explicito.
- Vinculos opcionais usam `SetNull` quando a preservacao do registro for mais importante que a exclusao.

## SQLite

O servidor ativa `PRAGMA foreign_keys = ON` na inicializacao.

## Status e tipos

SQLite nao usa enums nativos no Prisma. Por isso, status e tipos ficam como `String` no banco e sao padronizados em `backend/src/shared/domain.ts`.
