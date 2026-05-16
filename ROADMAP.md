# Roadmap

## Fase 0.1

- Alinhar estrutura com `AGENTS.md`.
- Ajustar banco para regras iniciais.
- Criar padrao backend de modulo.
- Criar design system dark premium.
- Criar testes iniciais de regras criticas.

## Clientes - Backend concluido

- `GET /clients` com busca por nome, e-mail, telefone e WhatsApp.
- `POST /clients` com Zod e e-mail unico.
- `PATCH /clients/:id`.
- `GET /clients/:id`.
- `GET /clients/:id/delete-impact`.
- `DELETE /clients/:id` com verificacao de vinculos.

## Clientes - Frontend concluido

- Tela de listagem com busca e filtro por status.
- Formulario de criacao e edicao com React Hook Form e Zod.
- Service frontend consumindo a API real de Clientes.
- Modal de exclusao com consulta de impacto.
- Bloqueio visual quando o cliente possui vinculos.
- Estados de carregamento, vazio, erro e sucesso.

## Projetos - Backend e Frontend inicial concluido

- Criar projeto vinculado a cliente.
- Validar cliente obrigatorio.
- Acompanhar projetos por status.
- Listar projetos com busca e filtros por status, tipo e cliente.
- Criar e editar projeto com React Hook Form e Zod.
- Exibir progresso calculado a partir das etapas existentes.
- Bloquear exclusao quando houver vinculos.

## Etapas, Orçamentos, Financeiro, Tarefas e Visitas - concluídos na primeira fatia

- Etapas padrão por tipo de projeto.
- Progresso real por etapas concluídas.
- Orçamentos com itens, envio e aprovação transacional.
- Financeiro com parcelas, pagamentos e indicadores.
- Tarefas com prioridade, status e prazos.
- Visitas técnicas com cliente obrigatório e projeto opcional.

## Dashboard e Relatórios - fatia executiva atual

- Dashboard conectado a dados reais, incluindo indicadores financeiros e operacionais.
- Relatórios consolidados em `/reports` com dados reais de clientes, comercial, projetos, financeiro, tarefas e visitas.
- Filtros por período concluídos em Relatórios.
- Atalhos filtrados concluídos para Orçamentos, Financeiro, Tarefas e Visitas.
- Escopos compostos concluídos para orçamentos abertos, tarefas atrasadas, tarefas vencendo em 7 dias e visitas próximas.
- Detalhamento de indicadores e exportação CSV simples concluídos em Relatórios.
- Próxima evolução recomendada: validar exportação com dados reais e avaliar filtros adicionais por cliente/projeto.
