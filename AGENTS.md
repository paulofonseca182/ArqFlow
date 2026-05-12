# AGENTS.md — ArqFlow

## Projeto

ArqFlow é um sistema local de gestão para escritórios de arquitetura.

Stack oficial:
- React 18+
- TypeScript 5+
- Tailwind CSS 3+
- React Router 6+
- React Hook Form 7+
- Zod 3+
- Axios 1+
- Node.js 20+
- Express 4+
- Prisma ORM 5+
- SQLite 3+
- Vite 5+
- pnpm 8+
- Vitest 1+

Modo inicial:
- Aplicação local em `localhost`
- Banco SQLite local
- Evolução futura possível para cloud

## Objetivo do MVP

O MVP deve permitir:

1. Cadastrar, editar, buscar e excluir clientes com confirmação.
2. Criar projeto vinculado a cliente.
3. Acompanhar projetos por status.
4. Gerar etapas padrão por tipo de projeto.
5. Marcar etapas como concluídas.
6. Calcular progresso do projeto.
7. Criar orçamento com itens.
8. Enviar orçamento.
9. Converter orçamento aprovado em projeto.
10. Registrar parcelas e pagamentos.
11. Exibir alertas de pagamentos atrasados e vencendo.
12. Criar tarefas.
13. Registrar visitas técnicas.
14. Vincular documentos a projetos com caminho local.
15. Visualizar dashboard com resumo real do escritório.

---

# Como o Codex deve trabalhar

Antes de alterar arquivos:

1. Ler este `AGENTS.md`.
2. Entender o módulo solicitado.
3. Verificar impacto em frontend, backend, banco e validações.
4. Fazer alterações pequenas, consistentes e testáveis.
5. Não criar soluções fora da stack oficial sem justificar.
6. Não remover regras de negócio.
7. Não duplicar lógica crítica entre módulos sem necessidade.
8. Não confiar apenas no frontend para validações importantes.
9. Sempre manter TypeScript.
10. Sempre preservar a identidade visual dark/minimalista do ArqFlow.

---

# Estrutura esperada do projeto

```txt
arqflow/
  AGENTS.md
  package.json
  pnpm-workspace.yaml

  frontend/
    src/
      components/
        ui/
        layout/
      pages/
        Dashboard/
        Clients/
        Projects/
        Budgets/
        Financial/
        Tasks/
        Visits/
        Documents/
        Briefings/
        Reports/
        Settings/
      services/
      hooks/
      types/
      utils/
      layouts/

  backend/
    src/
      modules/
        clients/
        projects/
        projectSteps/
        budgets/
        financial/
        tasks/
        visits/
        documents/
        briefings/
        reports/
      middleware/
      database/
      app.ts
      server.ts
    prisma/
      schema.prisma
      seed.ts
```

---

# Agente 01 — Arquiteto do Sistema

## Quando usar este papel

Use este papel quando a tarefa envolver:
- Estrutura do projeto.
- Organização de pastas.
- Decisão técnica.
- Refatoração.
- Integração entre módulos.
- Definição de fluxo.
- Padrões globais.

## Responsabilidades

- Manter arquitetura limpa e modular.
- Garantir separação entre frontend e backend.
- Evitar acoplamento excessivo.
- Revisar impacto entre módulos.
- Manter consistência com o cronograma do ArqFlow.
- Garantir evolução futura para login, backup, permissões e cloud.

## Regras

- Todo código deve usar TypeScript.
- Evitar arquivos gigantes.
- Preferir módulos pequenos e coesos.
- Usar nomes claros.
- Manter regras críticas no backend.
- Usar transações em operações multi-tabela.
- Não alterar a stack sem necessidade.

---

# Agente 02 — Banco de Dados e Prisma

## Quando usar este papel

Use este papel quando a tarefa envolver:
- `schema.prisma`
- Migrations.
- Seeds.
- Relacionamentos.
- Queries Prisma.
- Transações.
- Integridade dos dados.

## Responsabilidades

- Modelar banco SQLite com Prisma.
- Garantir relacionamentos corretos.
- Criar chaves estrangeiras.
- Ativar `PRAGMA foreign_keys = ON`.
- Criar seeds úteis.
- Evitar inconsistência entre dados.
- Definir exclusão protegida ou cascata conforme regra.

## Modelos principais

- Client
- Project
- ProjectStep
- Budget
- BudgetItem
- Payment
- Task
- Visit
- Document
- Briefing
- BriefingAnswer

## Regras de banco

- Project deve ter `client_id` obrigatório.
- Budget deve ter `client_id` obrigatório.
- Budget pode ter `project_id` nulo.
- Payment deve ter `project_id` obrigatório.
- Task pode ter `project_id` nulo.
- Visit pode ter `project_id` nulo.
- Document pode ter `client_id` e/ou `project_id`.
- Briefing deve ter `client_id`; `project_id` pode ser nulo.
- BudgetItem deve pertencer a Budget.
- BriefingAnswer deve pertencer a Briefing.

---

# Agente 03 — Backend / API

## Quando usar este papel

Use este papel quando a tarefa envolver:
- Express.
- Controllers.
- Services.
- Routes.
- Zod backend.
- Prisma services.
- Regras de negócio.
- API REST.

## Responsabilidades

- Criar rotas REST.
- Criar controllers.
- Criar services.
- Validar dados com Zod.
- Implementar regras críticas no backend.
- Padronizar erros.
- Criar paginação, busca e filtros.
- Usar `$transaction` em operações críticas.

## Padrão de módulo

```txt
backend/src/modules/clients/
  clients.routes.ts
  clients.controller.ts
  clients.service.ts
  clients.schema.ts
```

## Regras obrigatórias

- Não confiar em valores financeiros enviados pelo frontend.
- Calcular valor final de orçamento no backend.
- Calcular status atrasado dinamicamente.
- Validar datas no backend.
- Validar valores monetários no backend.
- Exigir confirmação lógica em exclusões críticas.
- Orçamento aprovado vira projeto usando `$transaction`.

---

# Agente 04 — Frontend / UI

## Quando usar este papel

Use este papel quando a tarefa envolver:
- React.
- Componentes.
- Telas.
- Layout.
- Tailwind.
- Design system.
- Dashboard.
- UX.

## Identidade visual

O ArqFlow deve ter interface:

- Dark mode.
- Minimalista.
- Sofisticada.
- Arquitetônica.
- Urbana.
- Profissional.
- Com linhas finas.
- Cards discretos.
- Bastante respiro visual.

## Paleta sugerida

```txt
Preto absoluto: #000000
Grafite profundo: #0B0B0B
Card escuro: #141414
Card secundário: #1A1A1A
Borda sutil: #2A2A2A
Texto principal: #F5F5F5
Texto secundário: #A8A8A8
Texto suave: #6F6F6F
Azul institucional: #103253
Bronze destaque: #B87333
Verde sucesso: #3BA66B
Amarelo alerta: #D6A84F
Vermelho atraso: #D95C5C
```

## Componentes obrigatórios

- Sidebar
- Header
- PageWrapper
- Button
- Input
- Select
- Textarea
- Card
- Table
- Badge
- Modal
- DeleteModal
- ProgressBar
- StatCard
- EmptyState
- LoadingState

## Regras de UI

- Usar componentes reutilizáveis.
- Usar badges para status.
- Usar modal para exclusões.
- Evitar telas poluídas.
- Tabelas devem ter filtros simples.
- Sidebar deve ter a marca ArqFlow no topo.
- Preservar consistência visual em todos os módulos.

---

# Agente 05 — Formulários e Validações

## Quando usar este papel

Use este papel quando a tarefa envolver:
- React Hook Form.
- Zod.
- Máscaras.
- Validação de inputs.
- Formulários dinâmicos.
- Mensagens de erro.

## Responsabilidades

- Criar schemas Zod.
- Criar formulários com React Hook Form.
- Criar mensagens de erro amigáveis.
- Criar máscaras para telefone, CPF/CNPJ, CEP, moeda e datas.
- Garantir validação no frontend e backend.
- Dividir formulários longos em seções.

## Regras de validação

- Cliente deve ter nome.
- Cliente deve ter telefone ou WhatsApp.
- E-mail deve ser válido.
- CPF/CNPJ são opcionais, mas se preenchidos devem ser válidos.
- Projeto deve ter cliente vinculado.
- Data de entrega não pode ser anterior à data de início.
- Orçamento enviado deve ter pelo menos um item.
- Valor financeiro deve ser maior que zero.
- Data de pagamento não pode ser futura.
- Pagamento deve estar vinculado a projeto.
- Etapa com data prevista antes da data de início deve ser bloqueada.

---

# Agente 06 — Financeiro e Regras de Negócio

## Quando usar este papel

Use este papel quando a tarefa envolver:
- Orçamentos.
- Parcelas.
- Pagamentos.
- Valores.
- Descontos.
- Status financeiro.
- Alertas.
- Dashboard financeiro.

## Regras financeiras

- Valor financeiro não pode ser zero ou negativo.
- Valor final do orçamento = soma dos itens - desconto.
- O backend deve calcular o valor final.
- Pagamento deve estar vinculado a projeto.
- Pagamento atrasado = vencimento menor que hoje e status diferente de Pago ou Cancelado.
- Ao marcar pagamento como Pago, preencher data de pagamento automaticamente.
- Data de pagamento não pode ser futura.
- Parcelas vencendo nos próximos 7 dias aparecem no dashboard.
- À vista deve gerar uma parcela.
- Parcelado em 2x deve gerar duas parcelas.
- Parcelado em 3x deve gerar três parcelas.
- Soma das parcelas acima do valor contratado deve gerar alerta.
- Projeto deve mostrar contratado, recebido, pendente e atrasado.

## Indicadores importantes

- Receita do mês.
- Receita do ano.
- Valor a receber.
- Valor recebido.
- Valor atrasado.
- Pagamentos próximos do vencimento.
- Orçamentos aprovados.
- Orçamentos recusados.
- Ticket médio por projeto.

---

# Agente 07 — Qualidade e Testes

## Quando usar este papel

Use este papel quando a tarefa envolver:
- Vitest.
- Testes unitários.
- Testes de integração.
- Revisão de código.
- Regras de negócio.
- Casos de borda.

## Testes obrigatórios

- Cliente com projeto vinculado exige alerta antes de exclusão.
- Busca de clientes por nome, e-mail e telefone.
- Projeto exige cliente.
- Data de entrega não pode ser anterior à data de início.
- Progresso do projeto = etapas concluídas / total.
- Orçamento enviado exige pelo menos 1 item.
- Valor final do orçamento é calculado no backend.
- Orçamento aprovado vira projeto via transaction.
- Pagamento atrasado é calculado corretamente.
- Marcar pagamento como pago preenche data.
- Valores financeiros negativos são bloqueados.

## Critério de qualidade

Antes de concluir uma tarefa:
1. Rodar lint, se existir.
2. Rodar testes, se existirem.
3. Verificar TypeScript.
4. Verificar se a alteração não quebra módulos relacionados.
5. Explicar o que foi alterado.

---

# Agente 08 — Documentação e Produto

## Quando usar este papel

Use este papel quando a tarefa envolver:
- README.
- Setup.
- API docs.
- Requisitos.
- Critérios de aceite.
- Manual de uso.
- Roadmap.
- Backlog.
- Changelog.

## Documentos esperados

- README.md
- SETUP.md
- API.md
- DATABASE.md
- DESIGN_SYSTEM.md
- BUSINESS_RULES.md
- ROADMAP.md
- CHANGELOG.md
- USER_GUIDE.md

## Critérios de aceite

Sempre que criar uma funcionalidade, documentar:

- Objetivo.
- Usuário beneficiado.
- Fluxo esperado.
- Regras de negócio.
- Campos necessários.
- Critérios de aceite.
- Possíveis erros.
- Melhorias futuras.

---

# Fluxo principal do ArqFlow

```txt
Lead / Primeiro contato
  ↓
Cliente
  ↓
Briefing
  ↓
Orçamento
  ↓
Aprovação ou recusa
  ↓
Projeto
  ↓
Etapas
  ↓
Financeiro + Tarefas + Visitas + Documentos
  ↓
Entrega final
  ↓
Projeto finalizado
```

---

# Status principais

## Status do cliente

```txt
Novo contato
Em atendimento
Orçamento enviado
Cliente ativo
Cliente inativo
Cliente recorrente
```

## Status do orçamento

```txt
Rascunho
Enviado
Em negociação
Aprovado
Recusado
Vencido
Cancelado
```

## Status do projeto

```txt
Contrato em andamento
Contrato assinado
Levantamento em andamento
Anteprojeto em desenvolvimento
Aguardando aprovação do cliente
Projeto executivo em desenvolvimento
Entrega final
Finalizado
Cancelado
```

## Status da etapa

```txt
Pendente
Em andamento
Aguardando cliente
Em revisão
Concluída
Cancelada
```

## Status financeiro

```txt
A receber
Pago
Parcialmente pago
Atrasado
Cancelado
```

---

# Regras gerais de implementação

1. Priorizar simplicidade e clareza.
2. Não criar dependências desnecessárias.
3. Manter consistência de nomes.
4. Backend é fonte da verdade para regras críticas.
5. Frontend deve validar para melhorar UX, mas não substituir backend.
6. Banco deve proteger integridade relacional.
7. UI deve manter estilo dark premium do ArqFlow.
8. Cálculos financeiros devem ser testados.
9. Conversão de orçamento em projeto deve ser transacional.
10. Toda exclusão crítica deve ter confirmação.

---

# Como responder no Codex

Ao concluir uma tarefa, explique:

1. Arquivos alterados.
2. O que foi implementado.
3. Como testar.
4. Regras de negócio aplicadas.
5. Próximos passos recomendados.
