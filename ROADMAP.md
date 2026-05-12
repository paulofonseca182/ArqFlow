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

## Proxima fase: Etapas de Projeto

- Preparar geracao de etapas padrao por tipo de projeto.
- Marcar etapas como concluidas.
- Calcular progresso do projeto como regra de backend.
