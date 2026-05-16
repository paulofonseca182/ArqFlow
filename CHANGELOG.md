# Changelog

## 0.5.3 - Relatórios com exportação e detalhamento

- Botão `Exportar CSV` adicionado em `/reports` para baixar o relatório carregado.
- Exportação usa `;`, BOM UTF-8 e dados já calculados pelo backend.
- Detalhamento visual adicionado para projetos por tipo, tarefas por prioridade e visitas por tipo.
- Testes frontend adicionados para a montagem do CSV e nome do arquivo.
- README, ROADMAP, USER_GUIDE e registro do projeto atualizados.

## 0.5.2 - Escopos compostos de Relatórios

- Contratos `OPEN_BUDGETS`, `OVERDUE_TASKS`, `DUE_SOON_TASKS` e `UPCOMING_VISITS` adicionados nas APIs relacionadas.
- Relatórios agora abrem orçamentos abertos, tarefas atrasadas, tarefas vencendo em 7 dias e visitas próximas com filtros explícitos.
- Telas de Orçamentos, Tarefas e Visitas passaram a exibir os escopos compostos recebidos pela URL.
- Testes backend de schema e service adicionados para os novos escopos.
- Validação visual local confirmou os atalhos compostos de `/reports` e os filtros nas telas destino.
- README, API e registro do projeto atualizados.

## 0.5.1 - Atalhos filtrados em Relatórios

- Indicadores de Relatórios agora abrem módulos relacionados com filtros pela URL.
- Financeiro, Orçamentos, Tarefas e Visitas passam a hidratar filtros iniciais a partir de query params.
- Filtro visual `Prazo: Atrasadas` adicionado em Tarefas.
- API de Tarefas aceita `overdue=true` para listar atrasos com regra dinâmica do backend.
- Helpers de query string e testes frontend adicionados.
- README, API e registro do projeto atualizados.

## 0.5.0 - Dashboard e Relatórios

- Dashboard ampliado com indicadores de tarefas, visitas e orçamentos abertos.
- Alertas de tarefas atrasadas e visitas próximas adicionados ao resumo inicial.
- Endpoint `GET /reports/overview` adicionado.
- Tela `/reports` substituiu o placeholder por relatórios reais.
- Relatórios consolidam clientes, comercial, projetos, financeiro, tarefas e visitas.
- Filtros de período adicionados em Relatórios: mês atual, ano atual e intervalo personalizado.
- Testes de service para Relatórios adicionados.
- README, API, Roadmap e registro do projeto atualizados.

## 0.4.0 - Projetos inicial

- Modulo backend de Projetos adicionado no padrao `routes/controller/service/schema`.
- Endpoints `/projects` e `/projects/meta` adicionados.
- Listagem de projetos com busca e filtros por status, tipo e cliente adicionada.
- Criacao e edicao de projeto com cliente obrigatorio adicionadas.
- Validacoes backend de cliente existente, datas e valores positivos adicionadas.
- Exclusao protegida de projetos com consulta de impacto adicionada.
- Tipos e service frontend de Projetos adicionados.
- Tela `/projects` com listagem, filtros, formulario e exclusao protegida adicionada.
- README, API, Roadmap e registro do projeto atualizados.

## 0.3.0 - Clientes frontend

- Tipos frontend para contratos de API, Cliente, paginacao e impacto de exclusao adicionados.
- Service `clients` consumindo os endpoints reais do backend adicionado.
- Tela `/clients` com listagem, busca, filtro por status e paginacao simples adicionada.
- Formulario em modal com React Hook Form e Zod adicionado.
- Validacao frontend de nome, email, CPF/CNPJ e telefone ou WhatsApp adicionada.
- Exclusao protegida com consulta previa de impacto adicionada.
- README e registro do projeto atualizados.

## 0.2.0 - Clientes backend

- CRUD backend de Clientes implementado.
- Busca por nome, e-mail, telefone e WhatsApp adicionada.
- Paginacao e filtro por status adicionados.
- Exclusao protegida com contagem de vinculos adicionada.
- Endpoint de impacto de exclusao adicionado.
- Migration adicionada para manter etapas em cascata e pagamentos protegidos.
- Testes de service de Clientes adicionados.

## 0.1.0 - Fase 0.1

- Estrutura alinhada ao `AGENTS.md`.
- Design system dark premium iniciado.
- Componentes UI obrigatorios adicionados.
- Contratos de dominio/status centralizados.
- Modulo de Documentos removido do escopo atual.
- Modulo de Briefings removido do escopo atual.
- Padrao backend de modulo preparado para Clientes.
- Testes iniciais de regras de negocio adicionados.
