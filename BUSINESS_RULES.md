# Regras de Negocio

## Regras gerais

- Backend e a fonte da verdade para regras criticas.
- Frontend valida para melhorar UX, mas nao substitui backend.
- Banco protege integridade relacional.
- Operacoes multi-tabela usam transacoes Prisma.
- Toda exclusao critica exige confirmacao.

## Clientes

- Cliente deve ter nome.
- Cliente deve ter telefone ou WhatsApp.
- E-mail deve ser valido e unico quando informado.
- CPF/CNPJ sao opcionais, mas devem ser validados quando preenchidos.
- Cliente com vinculos relevantes nao deve ser excluido sem verificacao de impacto.

## Projetos

- Projeto exige cliente.
- Data de entrega nao pode ser anterior a data de inicio.
- Progresso = etapas concluidas / total de etapas.
- Projeto cancelado/finalizado nao deve receber novas etapas ou tarefas.

## Orcamentos

- Orcamento exige cliente.
- Orcamento pode existir sem projeto.
- Orcamento enviado exige pelo menos um item.
- Valor final = soma dos itens - desconto.
- Valor final deve ser calculado no backend.
- Orcamento aprovado deve virar projeto via transacao.

## Financeiro

- Pagamento exige projeto.
- Valores financeiros devem ser maiores que zero.
- Pagamento atrasado e calculado dinamicamente.
- Ao marcar pagamento como pago, o backend preenche `paidAt`.
- Data de pagamento nao pode ser futura.
- Parcelas vencendo nos proximos 7 dias entram no dashboard.
