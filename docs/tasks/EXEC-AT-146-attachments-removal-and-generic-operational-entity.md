# EXEC-AT-146 - Arquivamento auditavel de anexos da Wiki

## Metadata
- status: completed-mvp-slice
- task: docs/tasks/TASK-AT-146-attachments-removal-and-generic-operational-entity.md
- completed: 2026-06-19

## Entrega
- Adicionado soft archive de anexos de Wiki com `archivedAt` e `archivedById`.
- Criada rota administrativa `DELETE /v1/wiki/attachments/:attachmentId`.
- Downloads ignoram anexos arquivados.
- Auditoria registra `wiki.attachment.archive` sem apagar o arquivo do storage.

## Validacao
- `npm run prisma:generate`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts`

## Risco residual
- A entidade generica transversal de anexos ainda nao foi criada; o slice fecha a dor mais sensivel atual da Wiki sem refatoracao ampla.
