# TASK-AT-128 - Scriptoteca: revisao rica de sugestoes

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-128-script-library-suggestion-review-upgrade.md

## Modo
- mode: workflow

## Objetivo unico
Melhorar a fila de sugestoes da Scriptoteca com comparacao visual, comentarios, notificacao ao autor e rastreio claro entre sugestao aceita/mesclada/rejeitada.

## Contexto
O fluxo de sugestao ja existe, mas a decisao ainda e simples. Para uso real, o autor precisa saber o que aconteceu e o gestor precisa comparar proposta com script atual.

## Escopo funcional
1. Mostrar diff simples quando sugestao for alteracao de script existente.
2. Exigir comentario ao rejeitar ou mesclar com mudancas.
3. Notificar autor quando sugestao for aceita, mesclada ou rejeitada.
4. Linkar sugestao ao script criado/alterado.

## Acceptance Criteria
1. Gestor decide com contexto suficiente.
2. Autor recebe retorno rastreavel.
3. Historico do script mostra origem da sugestao.
4. Permissoes atuais continuam preservadas.

## Riscos
- Diff rico pode ficar complexo. MVP pode usar comparacao textual simples.
