# TASK-AT-093 - Scriptoteca: CRUD, sugestoes e validacao

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-093-script-library-crud-validation-flow.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.5
- dependencias: `TASK-AT-089`, `TASK-AT-090`

## Objetivo unico
Permitir que Supervisor/Admin criem e validem scripts, e que SAC sugira novos textos ou alteracoes.

## Escopo funcional
1. Criar/editar script para Supervisor/Admin.
2. Sugerir script/alteracao para SAC.
3. Acoes de validar, voltar para rascunho e marcar obsoleto.
4. Comentario opcional de decisao.
5. Auditoria e notificacao basica quando sugestao for decidida.

## Acceptance Criteria
1. SAC nao publica script validado diretamente.
2. Supervisor/Admin valida com selo visivel.
3. Obsoleto sai da recomendacao principal.
4. Sugestao rejeitada mantém rastro.
5. Permissoes possuem testes.

## Riscos
- Duplicar fluxo de Wiki review sem necessidade.
- Validacao virar burocracia que impede uso.
