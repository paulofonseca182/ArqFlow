# Fase 0 - Fundacao Tecnica

## Objetivo

Converter o cronograma do ArqFlow em uma base tecnica consistente antes do inicio da Fase 1.

## Decisoes iniciais

- O MVP local nao tera autenticacao. As rotas protegidas ficam para a evolucao `v1.1`.
- Prisma e TypeScript usam `camelCase`. O banco SQLite pode manter os mesmos nomes sem `@map` nesta primeira versao para reduzir ruido.
- Regras criticas sao validadas no backend e, quando fizer sentido, tambem no frontend.
- Calculos derivados nao devem ser persistidos quando puderem ser calculados de forma segura, como pagamentos atrasados e progresso do projeto.
- Operacoes multi-tabela usam transacoes Prisma.
- Exclusoes permanentes exigem confirmacao explicita no frontend e validacao no backend.

## Politicas de dominio

### Clientes

- Cliente pode existir sem projetos.
- E-mail e opcional, mas quando informado deve ser unico.
- CPF/CNPJ e opcional, mas deve ser validado quando informado.
- Exclusao de cliente com vinculos relevantes deve ser bloqueada no MVP.

### Projetos

- Todo projeto pertence a um cliente.
- Projeto finalizado ou cancelado bloqueia novas etapas e tarefas.
- Progresso e derivado das etapas concluidas.
- Exclusao de projeto pode remover registros dependentes via cascata, desde que o impacto seja exibido antes da confirmacao.

### Orcamentos

- Orcamento pode existir com cliente e sem projeto.
- Valor final e calculado no backend a partir dos itens e desconto.
- Conversao para projeto deve acontecer em transacao.
- Orcamento aprovado, cancelado ou vencido nao pode ser editado.

### Financeiro

- Todo pagamento pertence a um projeto e a um cliente.
- Pagamento atrasado e calculado dinamicamente.
- Valores monetarios devem ser maiores que zero.
- Data de pagamento efetivo nao pode ser futura.

## Entregaveis da Fase 0

- Estrutura do monorepo.
- Configuracoes base de TypeScript.
- Schema Prisma do MVP.
- Esqueleto de backend com padroes de API.
- Esqueleto de frontend com layout inicial e rotas.
- Documentacao de decisoes tecnicas.

## Complemento Fase 0.1

- Estrutura alinhada ao `AGENTS.md`.
- `Document` permite vinculo por cliente e/ou projeto.
- Status oficiais ficam centralizados em `backend/src/shared/domain.ts`.
- Regras puras testaveis ficam em `backend/src/shared/business-rules.ts`.
- Frontend segue visual dark premium do ArqFlow.
- O modulo de Clientes tem trilho backend preparado para iniciar o CRUD.
