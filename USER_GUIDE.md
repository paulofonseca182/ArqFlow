# Guia De Uso

O ArqFlow ainda está em evolução, mas o fluxo principal do MVP já segue a regra comercial RN-P11: projeto contratado deve nascer de orçamento aprovado.

## Fluxo Principal

1. Registrar cliente.
2. Criar orçamento para o cliente.
3. Enviar o orçamento.
4. Aprovar ou recusar o orçamento.
5. Quando aprovado, gerar o projeto operacional a partir do orçamento.
6. Acompanhar etapas do projeto.
7. Gerar parcelas e registrar pagamentos.
8. Registrar tarefas e visitas técnicas.
9. Finalizar projeto.

## Orçamentos E Projetos

- Em Orçamentos, a ação `Aprovar` faz apenas a aprovação comercial.
- O título do orçamento deve ter no máximo 30 caracteres.
- O tipo de serviço deve ter no máximo 20 caracteres.
- A validade do orçamento não pode ser anterior à data em que ele está sendo registrado.
- A aprovação muda o orçamento para `Aprovado` e registra a data de aprovação.
- Aprovar um orçamento não cria projeto automaticamente.
- Para criar o projeto, use a ação `Gerar projeto` em Orçamentos ou `Criar por orçamento aprovado` em Projetos.
- A geração do projeto cria o vínculo entre orçamento, cliente, valor contratado e execução.
- Orçamentos aprovados não devem ser editados; se houver erro em proposta aprovada, registre uma nova versão comercial em vez de alterar o histórico.
- Cadastro manual de projeto existe apenas para legado ou interno.
- Projeto legado exige data de início original e justificativa.
- Projeto interno exige descrição ou motivo.
- Projetos manuais não representam conversão comercial comum.

## Financeiro E Parcelas

- Gere parcelas a partir do projeto com valor contratado, usando a ação `Gerar parcelas`.
- O backend divide o valor contratado em 1x a 12x e preserva centavos.
- A soma das parcelas ativas deve ser sempre igual ao valor contratado do projeto.
- Ao editar uma parcela, o valor fica bloqueado; ajuste apenas número, vencimento, forma de pagamento, observações e dados operacionais.
- Para alterar quantidade ou valores de parcelas já criadas, use a ação `Reorganizar parcelas`.
- Na reorganização, o novo plano só é salvo se a soma das parcelas válidas for igual ao valor contratado do projeto.
- Parcelas pagas ficam bloqueadas e não podem ser alteradas ou removidas.
- Parcelas parcialmente pagas preservam o valor já recebido e não podem ficar com valor menor do que já foi pago.
- Para registrar recebimento total ou parcial, use a ação de pagamento da parcela.
- O valor contratado do projeto não deve ser alterado quando já existem parcelas ativas.

## Relatórios

- Acesse `/reports` para ver uma visão consolidada do escritório.
- Use mês atual, ano atual ou intervalo personalizado.
- Use os filtros de cliente e projeto para analisar um recorte específico sem sair de Relatórios.
- Relatórios separam projetos por origem: orçamento aprovado, legado ou interno.
- Clique nos indicadores com seta para abrir o módulo relacionado já filtrado.
- Quando houver cliente ou projeto ativo, os atalhos preservam esse escopo nas telas destino.
- Indicadores compostos como orçamentos abertos, tarefas vencendo em 7 dias e visitas próximas usam filtros próprios nas telas destino.
- Use `Exportar CSV` para baixar o relatório carregado e abrir em Excel ou LibreOffice.
- O CSV exportado identifica o cliente e o projeto filtrados, quando existirem.
- Consulte os blocos de detalhamento para ver projetos por tipo/origem, tarefas por prioridade e visitas por tipo.
- Use `Limpar filtros` no módulo destino para voltar à listagem completa.
