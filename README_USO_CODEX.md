# Pacote Codex — ArqFlow

Este pacote foi preparado para uso no OpenAI Codex.

## Arquivo principal

Use o arquivo:

```txt
AGENTS.md
```

na raiz do repositório do ArqFlow.

Segundo a documentação do Codex, ele lê arquivos `AGENTS.md` antes de começar o trabalho, usando essas instruções como contexto do projeto.

## Onde colocar

Estrutura recomendada:

```txt
arqflow/
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  frontend/
  backend/
```

## Como usar no Codex

1. Crie ou abra o repositório do ArqFlow.
2. Coloque o arquivo `AGENTS.md` na raiz do projeto.
3. Abra o projeto no Codex.
4. Peça tarefas específicas, por exemplo:

```txt
Implemente a Fase 1 do ArqFlow seguindo o AGENTS.md.
```

ou:

```txt
Crie o módulo de clientes completo, com backend, frontend, Prisma, validações e testes, seguindo o AGENTS.md.
```

## Sobre arquivos .toml

Para o Codex, os agentes/instruções do projeto devem ficar no `AGENTS.md`.

Arquivos `.toml` são usados para configuração de ferramenta/ambiente, não como arquivo principal dos agentes do projeto.

## Recomendação

Comece com tarefas pequenas:

```txt
1. Criar monorepo.
2. Configurar backend Express.
3. Configurar frontend Vite React.
4. Configurar Prisma SQLite.
5. Criar módulo Clients.
```
