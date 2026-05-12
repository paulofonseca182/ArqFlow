# Changelog

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
- Regra de `Document` ajustada para cliente e/ou projeto.
- Padrao backend de modulo preparado para Clientes.
- Testes iniciais de regras de negocio adicionados.
