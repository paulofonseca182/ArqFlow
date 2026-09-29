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
- RN-F12: parcelas ativas de projeto devem somar exatamente o valor contratado.
- Edicao comum de parcela nao altera valor da parcela.
- Reorganizacao de parcelas deve ocorrer em acao propria e transacional.
- Reorganizacao pode alterar quantidade, valores e vencimentos, desde que a soma das parcelas validas feche com o valor contratado do projeto.
- Parcela paga nao pode ser alterada nem removida na reorganizacao.
- Parcela parcialmente paga nao pode ser removida e seu novo valor nao pode ser menor que o valor ja recebido.
- Lancamento financeiro de visita tecnica nao entra na soma contratual da RN-F12.
- RN-F20: caixa representa apenas dinheiro efetivamente recebido ou pago.
- Recebivel pago ou parcialmente pago deve gerar movimentacao de caixa de entrada.
- Despesa paga deve gerar movimentacao de caixa de saida.
- Contas a receber e contas a pagar compoem previsao financeira por vencimento.
- Caixa realizado usa `CashMovement`, nunca apenas data de vencimento.
- Pagamento futuro e bloqueado para recebiveis e despesas.
- Pagamento maior que o valor devido e bloqueado para recebiveis.
- Despesa cancelada nao entra no fluxo previsto nem no caixa realizado.
- Visita tecnica cobrada gera recebivel separado e nao altera o valor contratado do projeto.
- RN-F21: compra parcelada deve ser cadastrada uma unica vez como obrigacao principal e gerar parcelas vinculadas.
- A compra principal nao gera `CashMovement` ao ser cadastrada e nao deve ser somada junto das parcelas.
- Parcelas de despesa representam os vencimentos previstos; o fluxo previsto usa apenas o saldo pendente das parcelas validas.
- Cada baixa total ou parcial de parcela de despesa gera uma `ExpensePayment` e uma saida de caixa propria em `CashMovement`.
- Pagamento parcial de despesa preserva saldo pendente e historico de baixas por data.
- Pagamento maior que o saldo pendente da despesa e bloqueado.
- Compra parcelada com parcela paga ou parcialmente paga nao pode ser reorganizada no MVP sem fluxo de estorno/ajuste auditavel.
- Compra parcelada permite classificacao gerencial, como despesa operacional, aquisicao de bem/investimento, custo de projeto ou outra classificacao.
- Exclusao definitiva de despesa so e permitida quando nao existe pagamento nem movimentacao de caixa vinculada.
- Compra parcelada sem pagamento pode ser excluida junto com suas parcelas; compras com baixa registrada devem ser canceladas ou tratadas por estorno futuro.
