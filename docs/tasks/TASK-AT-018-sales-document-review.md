# TASK-AT-018 - Sales document review

## Metadata
- status: completed-mvp
- owner: runtime-builder
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-018-sales-document-review.md

## Objetivo
Permitir que perfis superiores revisem notas extraidas antes de alimentar ranking e extratos.

## Entregue
- Endpoint `PATCH /v1/sales/documents/:documentId/review`.
- Roles de revisao: `ADMIN`, `GESTOR`, `SAC`, `FINANCEIRO`.
- Status suportados no MVP: `APPROVED`, `REJECTED`, `DUPLICATE`.
- Substituicao transacional dos itens comerciais revisados.
- Registro de revisor, data de revisao e auditoria.
- Acoes de aprovar/reprovar na tela de Notas.

## Aceite
- Nota `PENDING_REVIEW` pode ser aprovada quando possui itens.
- Nota pode ser reprovada com motivo padrao no MVP.
- Chave de acesso duplicada bloqueia aprovacao.

## Residual
- Falta editor visual de campos/itens antes da aprovacao.
- Falta fila dedicada com filtros de revisao.
