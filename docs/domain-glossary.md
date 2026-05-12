# Glossario de Dominio

## Entidades principais

- `Client`: pessoa ou empresa atendida pelo escritorio.
- `Project`: obra ou servico contratado, sempre vinculado a um cliente.
- `ProjectStep`: etapa operacional de um projeto.
- `Budget`: proposta/orcamento enviado a um cliente, podendo virar projeto.
- `BudgetItem`: item que compoe o calculo de um orcamento.
- `Payment`: parcela ou lancamento financeiro de um projeto.
- `Task`: atividade livre ou vinculada a um projeto.
- `Visit`: visita tecnica associada a cliente e opcionalmente a projeto.
- `Document`: registro de documento local associado a cliente/projeto.
- `Briefing`: conjunto de perguntas e respostas por tipo de projeto.

## Nomes padronizados

- `completedAt` para conclusao de etapa.
- `paidAt` para pagamento efetivo.
- `sortOrder` para ordenacao manual.
- `amount`, `paidAmount`, `totalAmount`, `finalAmount` para valores monetarios.
- `startsAt`, `dueDate`, `expectedDeliveryDate`, `expiresAt` para datas de negocio.

## Status e tipos

SQLite nao tem enum nativo no Prisma. Por isso, status e tipos ficam como `String` no schema e sao padronizados em constantes TypeScript no backend.
