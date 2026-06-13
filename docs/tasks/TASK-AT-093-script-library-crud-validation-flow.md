# TASK-AT-093 - Scriptoteca: sugestoes e decisao de novos scripts

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-093-script-library-crud-validation-flow.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.5
- dependencias: `TASK-AT-089`, `TASK-AT-090`

## Objetivo unico
Permitir que SAC sugira novos scripts ou alteracoes, sem publicar diretamente, e que Supervisor/Admin decidam com comentario e rastro.

## Escopo funcional
1. Formulario de sugestao liberado para SAC, Vendas, Supervisor e Admin.
2. Sugestao pode ser novo script ou alteracao de script existente.
3. Estados: `SUGGESTED`, `ACCEPTED`, `REJECTED`, `MERGED`.
4. Acoes de aceitar, rejeitar e mesclar para Supervisor/Admin.
5. Comentario opcional de decisao, visivel para quem sugeriu.
6. Auditoria e notificacao basica quando sugestao for decidida.
7. Evitar duplicar CRUD gerencial ja entregue no MVP; focar na esteira de sugestao.

## Acceptance Criteria
1. SAC nao publica script validado diretamente.
2. Supervisor/Admin transforma sugestao aceita em script validado ou rascunho.
3. Obsoleto sai da recomendacao principal.
4. Sugestao rejeitada mantém rastro.
5. Permissoes possuem testes.
6. Usuario que sugeriu recebe notificacao de decisao.

## Riscos
- Duplicar fluxo de Wiki review sem necessidade.
- Validacao virar burocracia que impede uso.
